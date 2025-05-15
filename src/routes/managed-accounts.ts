import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getGoogleAuthUrl, getGoogleTokens, getGoogleUserInfo } from '../utils/google-auth';
import models from '../models';
import { AuthRequest } from '../middleware/auth.types';

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
      include: [{
        model: models.Campaign,
        as: 'campaigns'
      }]
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching managed accounts' });
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
router.get('/callback', authenticate, async (req: AuthRequest, res) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ message: 'Invalid authorization code' });
    }

    const tokens = await getGoogleTokens(code);
    const userInfo = await getGoogleUserInfo(tokens.id_token!);

    if (!userInfo || !userInfo.sub || !userInfo.email) {
      return res.status(400).json({ message: 'Invalid user information' });
    }

    const existingAccount = await models.ManagedAccount.findOne({
      where: {
        userId: req.user!.id,
        managedGoogleId: userInfo.sub
      }
    });

    if (existingAccount) {
      return res.status(400).json({ message: 'This Google Ads account is already managed' });
    }

    const managedAccount = await models.ManagedAccount.create({
      userId: req.user!.id,
      managedGoogleId: userInfo.sub,
      managedEmail: userInfo.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard/accounts/${managedAccount.id}`);
  } catch (error) {
    res.status(500).json({ message: 'Error adding managed account' });
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
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const account = await models.ManagedAccount.findOne({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!account) {
      return res.status(404).json({ message: 'Managed account not found' });
    }

    await account.destroy();
    res.json({ message: 'Managed account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting managed account' });
  }
});

export default router;
