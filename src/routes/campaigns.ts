import express, { Response } from 'express';
import { google } from 'googleapis';
import models from '../models';
import { AuthRequest } from '../middleware/auth.types';
import { CampaignCreationAttributes } from '../models/campaign.types';
import { ManagedAccountInstance } from '../models/managed-account.types';
import config from '../config/app';

const router = express.Router();

// Get all campaigns for a managed account
router.get('/:managedAccountId', async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const campaigns = await models.Campaign.findAll({
      where: { managedAccountId: req.params.managedAccountId },
      include: [{ model: models.ManagedAccount, as: 'managedAccount' }],
    });
    return res.json(campaigns);
  } catch (error) {
    console.error(error?.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new campaign
router.post('/:managedAccountId', async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const managedAccount = await models.ManagedAccount.findByPk(req.params.managedAccountId);
    if (!managedAccount) {
      return res.status(404).json({ error: 'Managed account not found' });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      access_token: managedAccount.accessToken,
      refresh_token: managedAccount.refreshToken,
    });

    const adsService = (google as any).adwords({
      version: config.google.adsApiVersion,
      auth,
      developerToken: config.google.adsDeveloperToken,
    });

    // Create campaign in Google Ads
    const response = await adsService.campaigns.create({
      customerId: managedAccount.adsAccountId,
      requestBody: {
        campaign: {
          name: req.body.name,
          status: req.body.status,
          budget: req.body.budget,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
        },
      },
    });

    // Save campaign to database
    const campaignData: CampaignCreationAttributes = {
      managedAccountId: managedAccount.id,
      campaignId: response.data.id,
      name: req.body.name,
      status: req.body.status,
      budget: req.body.budget,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
    };

    const campaign = await models.Campaign.create(campaignData);
    return res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a campaign
router.delete('/:managedAccountId/:campaignId', async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const campaign = await models.Campaign.findOne({
      where: {
        managedAccountId: req.params.managedAccountId,
        campaignId: req.params.campaignId,
      },
      include: [{ model: models.ManagedAccount, as: 'managedAccount' }],
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const managedAccount = campaign.get('managedAccount') as ManagedAccountInstance;
    if (!managedAccount) {
      return res.status(404).json({ error: 'Managed account not found' });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      access_token: managedAccount.accessToken,
      refresh_token: managedAccount.refreshToken,
    });

    const adsService = (google as any).adwords({
      version: config.google.adsApiVersion,
      auth,
      developerToken: config.google.adsDeveloperToken,
    });

    // Delete campaign in Google Ads
    await adsService.campaigns.delete({
      name: `customers/${managedAccount.adsAccountId}/campaigns/${campaign.campaignId}`,
    });

    // Delete campaign from database
    await campaign.destroy();

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
