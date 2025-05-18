import { Router, Response } from 'express';
import { getGoogleAuthUrl, getGoogleTokens, getGoogleUserInfo } from '../utils/google-auth';
import { checkGoogleAdsAccount, getGoogleAdsAccountCreationLink } from '../utils/google-ads';
import { generateToken } from '../utils/jwt';
import models from '../models';
import { AuthRequest } from '../middleware/auth.types';
import { UserCreationAttributes } from '../models/user.types';
import { authenticate } from '../middleware/auth';
import config from '../config/app';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Create a new user account with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', async (req, res): Promise<Response> => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await models.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const userData: UserCreationAttributes = {
      email,
      password,
      name,
      googleId: null,
      picture: null,
      accessToken: null,
      refreshToken: null,
    };

    const user = await models.User.create(userData);

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return res.json({ token });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Error creating user' });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login user
 *     description: Authenticate user with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req, res): Promise<Response> => {
  try {
    const { email, password } = req.body;

    const user = await models.User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Error during login' });
  }
});

/**
 * @swagger
 * /auth/google:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get Google OAuth URL
 *     description: Returns Google OAuth consent screen URL
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
 */
router.get('/google', (_req, res) => {
  const authUrl = getGoogleAuthUrl(config.google.callbackUrl);
  res.json({ url: authUrl });
});

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Handle Google OAuth callback
 *     description: Process Google OAuth callback and create/update user
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *     responses:
 *       200:
 *         description: Successfully authenticated with Google
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for authenticated user
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: User ID
 *                     email:
 *                       type: string
 *                       description: User email
 *                     name:
 *                       type: string
 *                       description: User name
 *                     picture:
 *                       type: string
 *                       description: User profile picture URL
 *       400:
 *         description: Invalid authorization code or user information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error during authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/google/callback', async (req: AuthRequest, res): Promise<Response> => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ message: 'Invalid authorization code' });
    }

    const tokens = await getGoogleTokens(code);
    if (!tokens.id_token) {
      return res.status(400).json({ message: 'Invalid tokens received' });
    }

    const userInfo = await getGoogleUserInfo(tokens.id_token);
    if (!userInfo) {
      return res.status(400).json({ message: 'Could not get user information' });
    }

    let user = await models.User.findOne({
      where: { googleId: userInfo.sub },
    });

    if (!user) {
      const userData: UserCreationAttributes = {
        googleId: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture || null,
        accessToken: tokens.access_token || null,
        refreshToken: tokens.refresh_token || null,
        password: null,
      };

      user = await models.User.create(userData);
    } else {
      await user.update({
        accessToken: tokens.access_token || null,
        refreshToken: tokens.refresh_token || null,
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ message: 'Error during Google authentication' });
  }
});

/**
 * @swagger
 * /auth/check-ads-account:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Check if user has Google Ads account
 *     description: Checks if the authenticated user has an associated Google Ads account
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Google Ads account status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasAccount:
 *                   type: boolean
 *                   description: Whether user has Google Ads account
 *                 accountDetails:
 *                   type: object
 *                   description: Account details if exists
 *                 createAccountUrl:
 *                   type: string
 *                   description: URL to create new account if none exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/check-ads-account', authenticate, async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (!req.user?.accessToken) {
      return res.status(401).json({ 
        message: 'No Google access token found',
        createAccountUrl: getGoogleAdsAccountCreationLink()
      });
    }

    const adsAccount = await checkGoogleAdsAccount(req.user.accessToken);

    if (!adsAccount) {
      return res.json({
        hasAccount: false,
        createAccountUrl: getGoogleAdsAccountCreationLink()
      });
    }

    return res.json({
      hasAccount: true,
      accountDetails: adsAccount
    });
  } catch (error) {
    console.error('Error checking Google Ads account:', error);
    return res.status(500).json({ message: 'Error checking Google Ads account' });
  }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current user information
 *     description: Returns information about the currently authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const user = await models.User.findByPk(req.user!.id, {
      attributes: ['id', 'email', 'name', 'picture', 'googleId']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Error fetching user info:', error);
    return res.status(500).json({ message: 'Error fetching user information' });
  }
});

export default router;
