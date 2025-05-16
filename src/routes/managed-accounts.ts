import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { getGoogleAuthUrl, getGoogleTokens } from '../utils/google-auth';
import models from '../models';
import { AuthRequest } from '../middleware/auth.types';
import { ManagedAccountCreationAttributes } from '../models/managed-account.types';
import { google } from 'googleapis';

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
 * /api/managed-accounts/add:
 *   get:
 *     tags:
 *       - Managed Accounts
 *     summary: Start adding new managed account
 *     description: Start Google OAuth flow for adding a new managed account
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       302:
 *         description: Redirect to Google consent screen
 *       401:
 *         description: Unauthorized
 */
router.get('/add', authenticate, (_req, res) => {
  const authUrl = getGoogleAuthUrl();
  res.redirect(authUrl);
});

/**
 * @swagger
 * /api/managed-accounts/callback:
 *   get:
 *     tags:
 *       - Managed Accounts
 *     summary: Handle new managed account callback
 *     description: Process Google OAuth callback for adding a new managed account
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *     responses:
 *       302:
 *         description: Redirect to dashboard with new account
 *       400:
 *         description: Invalid authorization code or account already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 */
router.get('/callback', authenticate, async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Invalid authorization code' });
    }

    const tokens = await getGoogleTokens(code);
    if (!tokens.access_token) {
      return res.status(400).json({ error: 'Invalid tokens received' });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    const adsService = (google as any).adwords({
      version: 'v14',
      auth,
    });

    const response = await adsService.managedCustomerService.get({});
    const managedAccounts = response.data.entries || [];

    const existingManagedAccount = await models.ManagedAccount.findOne({
      where: {
        userId: req.user!.id,
        managedGoogleId: managedAccounts[0].customerId,
      },
    });

    if (existingManagedAccount) {
      await existingManagedAccount.update({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });

      return res.json(existingManagedAccount);
    }

    const managedAccountData: ManagedAccountCreationAttributes = {
      userId: req.user!.id,
      managedGoogleId: managedAccounts[0].customerId,
      managedEmail: managedAccounts[0].customerName,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };

    const managedAccount = await models.ManagedAccount.create(managedAccountData);
    return res.json(managedAccount);
  } catch (error) {
    console.error('Error linking Google Ads account:', error);
    return res.status(500).json({ error: 'Error linking Google Ads account' });
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

export default router;
