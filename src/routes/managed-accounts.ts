import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { getGoogleAuthUrl, getGoogleTokens, getGoogleUserInfo } from '../utils/google-auth';
import { checkGoogleAdsAccount, listAccessibleAccounts, checkAccountAccess } from '../utils/google-ads';
import models from '../models';
import { AuthRequest } from '../middleware/auth.types';
import { ManagedAccountCreationAttributes } from '../models/managed-account.types';
import { google } from 'googleapis';
import config from '../config/app';

const router = Router();

/**
 * @swagger
 * /api/managed-accounts:
 *   get:
 *     tags:
 *       - Managed Accounts
 *     summary: Get all managed accounts
 *     description: Retrieve all managed accounts for the authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of managed accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ManagedAccount'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const accounts = await models.ManagedAccount.findAll({
      where: { userId: req.user!.id },
      include: [
        {
          model: models.Campaign,
          as: 'campaigns',
        },
      ],
    });
    res.json(accounts);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/managed-accounts/auth-url:
 *   get:
 *     tags:
 *       - Managed Accounts
 *     summary: Get URL for adding new managed account
 *     description: Get Google OAuth URL for adding a new managed account
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Google OAuth URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: URL to start Google OAuth flow
 *       401:
 *         description: Unauthorized
 */
router.get('/auth-url', authenticate, (_req, res) => {
  const authUrl = getGoogleAuthUrl(`${config.google.callbackUrl}/managed-accounts/callback`);
  res.json({ url: authUrl });
});

/**
 * @swagger
 * /api/managed-accounts/callback:
 *   get:
 *     tags:
 *       - Managed Accounts
 *     summary: Handle Google OAuth callback
 *     description: Process callback from Google OAuth and list available accounts
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *     responses:
 *       200:
 *         description: Available Google Ads accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userInfo:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     picture:
 *                       type: string
 *                 accounts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GoogleAdsAccount'
 *       400:
 *         description: Invalid request or no accounts found
 */
router.get('/callback', async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ message: 'Invalid authorization code' });
    }

    // Получаем токены
    const tokens = await getGoogleTokens(code);
    if (!tokens.access_token || !tokens.id_token) {
      return res.status(400).json({ message: 'Invalid tokens received' });
    }

    // Получаем информацию о пользователе
    const userInfo = await getGoogleUserInfo(tokens.id_token);
    if (!userInfo) {
      return res.status(400).json({ message: 'Could not get user information' });
    }

    // Получаем список доступных аккаунтов
    const accounts = await listAccessibleAccounts(tokens.access_token);
    
    if (accounts.length === 0) {
      return res.status(400).json({ 
        message: 'No Google Ads accounts found',
        createAccountUrl: 'https://ads.google.com/nav/selectaccount'
      });
    }

    // Сохраняем токены во временное хранилище (можно использовать Redis)
    // TODO: Implement temporary token storage
    const tempAuthKey = Math.random().toString(36).substring(7);
    
    return res.json({
      tempAuthKey, // Временный ключ для последующей авторизации
      userInfo: {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      },
      accounts: accounts.map(account => ({
        customerId: account.customerId,
        descriptiveName: account.descriptiveName,
        currencyCode: account.currencyCode,
        timeZone: account.timeZone,
        status: account.status
      }))
    });

  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return res.status(500).json({ message: 'Error processing callback' });
  }
});

/**
 * @swagger
 * /api/managed-accounts/select:
 *   post:
 *     tags:
 *       - Managed Accounts
 *     summary: Select Google Ads account to manage
 *     description: Connect selected Google Ads account for management
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - tempAuthKey
 *             properties:
 *               customerId:
 *                 type: string
 *               tempAuthKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account successfully connected
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ManagedAccount'
 */
router.post('/select', authenticate, async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { customerId, tempAuthKey } = req.body;

    if (!customerId || !tempAuthKey) {
      return res.status(400).json({ message: 'Customer ID and temporary auth key are required' });
    }

    // TODO: Get tokens from temporary storage using tempAuthKey
    // const tokens = await getTempTokens(tempAuthKey);
    
    // Проверяем, не подключен ли уже этот аккаунт
    const existingAccount = await models.ManagedAccount.findOne({
      where: { 
        managedGoogleId: customerId,
        userId: req.user!.id
      }
    });

    if (existingAccount) {
      return res.status(400).json({ message: 'This account is already connected' });
    }

    // Проверяем права доступа
    const access = await checkAccountAccess(req.user!.accessToken!, customerId);
    
    if (!access || access.accessLevel === 'READ_ONLY') {
      return res.status(403).json({
        message: 'Insufficient permissions for this Google Ads account'
      });
    }

    // Создаем новый управляемый аккаунт
    const managedAccountData: ManagedAccountCreationAttributes = {
      userId: req.user!.id,
      managedGoogleId: customerId,
      managedEmail: access.emailAddress,
      accessToken: req.user!.accessToken!,
      refreshToken: req.user!.refreshToken || null,
    };

    const managedAccount = await models.ManagedAccount.create(managedAccountData);

    // TODO: Remove temporary tokens
    // await removeTempTokens(tempAuthKey);

    return res.json(managedAccount);
  } catch (error) {
    console.error('Error selecting account:', error);
    return res.status(500).json({ message: 'Error connecting account' });
  }
});

/**
 * @swagger
 * /api/managed-accounts/{id}:
 *   delete:
 *     tags:
 *       - Managed Accounts
 *     summary: Delete managed account
 *     description: Remove a managed account by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Managed account ID
 *     responses:
 *       200:
 *         description: Account successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Account not found
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const managedAccount = await models.ManagedAccount.findOne({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!managedAccount) {
      return res.status(404).json({ error: 'Managed account not found' });
    }

    await managedAccount.destroy();
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting managed account:', error);
    return res.status(500).json({ error: 'Error deleting managed account' });
  }
});

/**
 * @swagger
 * /api/managed-accounts/check:
 *   post:
 *     tags:
 *       - Managed Accounts
 *     summary: Check Google Ads account existence
 *     description: Check if a Google Ads account exists and get its details
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Account check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *                 account:
 *                   $ref: '#/components/schemas/GoogleAdsAccount'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 */
router.post('/check', authenticate, async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Проверяем, не подключен ли уже этот аккаунт
    const existingAccount = await models.ManagedAccount.findOne({
      where: { managedEmail: email }
    });

    if (existingAccount) {
      return res.status(400).json({ 
        message: 'This Google Ads account is already connected',
        accountId: existingAccount.id
      });
    }

    if (!req.user?.accessToken) {
      return res.status(401).json({ message: 'No access token found' });
    }

    // Проверяем существование аккаунта Google Ads
    const adsAccount = await checkGoogleAdsAccount(req.user.accessToken);
    
    if (!adsAccount) {
      return res.json({
        exists: false,
        message: 'No Google Ads account found for this email'
      });
    }

    // Проверяем права доступа
    const access = await checkAccountAccess(req.user.accessToken, adsAccount.customerId);
    
    if (!access || access.accessLevel === 'READ_ONLY') {
      return res.status(403).json({
        message: 'Insufficient permissions for this Google Ads account'
      });
    }

    return res.json({
      exists: true,
      account: adsAccount,
      access
    });
  } catch (error) {
    console.error('Error checking Google Ads account:', error);
    return res.status(500).json({ message: 'Error checking Google Ads account' });
  }
});

/**
 * @swagger
 * /api/managed-accounts/connect:
 *   post:
 *     tags:
 *       - Managed Accounts
 *     summary: Connect new Google Ads account
 *     description: Connect a new Google Ads account to manage
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - customerId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               customerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account successfully connected
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ManagedAccount'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request or account already exists
 */
router.post('/connect', authenticate, async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { email, customerId } = req.body;

    if (!email || !customerId) {
      return res.status(400).json({ message: 'Email and customerId are required' });
    }

    // Проверяем, не подключен ли уже этот аккаунт
    const existingAccount = await models.ManagedAccount.findOne({
      where: { 
        managedEmail: email,
        managedGoogleId: customerId
      }
    });

    if (existingAccount) {
      return res.status(400).json({ message: 'This account is already connected' });
    }

    if (!req.user?.accessToken) {
      return res.status(401).json({ message: 'No access token found' });
    }

    // Проверяем права доступа
    const access = await checkAccountAccess(req.user.accessToken, customerId);
    
    if (!access || access.accessLevel === 'READ_ONLY') {
      return res.status(403).json({
        message: 'Insufficient permissions for this Google Ads account'
      });
    }

    // Создаем новый управляемый аккаунт
    const managedAccountData: ManagedAccountCreationAttributes = {
      userId: req.user.id,
      managedGoogleId: customerId,
      managedEmail: email,
      accessToken: req.user.accessToken,
      refreshToken: req.user.refreshToken || null,
    };

    const managedAccount = await models.ManagedAccount.create(managedAccountData);

    return res.json(managedAccount);
  } catch (error) {
    console.error('Error connecting Google Ads account:', error);
    return res.status(500).json({ message: 'Error connecting Google Ads account' });
  }
});

export default router;
