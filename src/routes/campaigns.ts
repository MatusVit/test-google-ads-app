import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth.types';
import models from '../models';
import { CampaignCreationAttributes } from '../models/campaign.types';
import { ManagedAccountInstance } from '../models/managed-account.types';
import config from '../config/app';

// @ts-expect-error - Dynamic import of CommonJS module
const googleAdsApi = await import('google-ads-api');
const { Client } = googleAdsApi.default;

const router = Router();

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

    const client = new Client({
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      developer_token: config.google.adsDeveloperToken,
    });

    client.setAccessToken(managedAccount.accessToken);

    // Create campaign in Google Ads
    const response = await client.mutateResource({
      customerId: managedAccount.adsAccountId,
      resource: 'campaigns',
      operation: 'create',
      params: {
        campaign: {
          name: req.body.name,
          status: req.body.status,
          advertisingChannelType: 'SEARCH',
          campaignBudget: {
            amountMicros: Math.round(req.body.budget * 1000000),
          },
          startDate: req.body.startDate.replace(/-/g, ''),
          endDate: req.body.endDate ? req.body.endDate.replace(/-/g, '') : undefined,
        },
      },
    });

    // Save campaign to database
    const campaignData: CampaignCreationAttributes = {
      managedAccountId: managedAccount.id,
      campaignId: response.results[0].resourceName.split('/').pop(),
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
router.delete(
  '/:managedAccountId/:campaignId',
  async (req: AuthRequest, res: Response): Promise<Response> => {
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

      const client = new Client({
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        developer_token: config.google.adsDeveloperToken,
      });

      client.setAccessToken(managedAccount.accessToken);

      // Delete campaign in Google Ads
      await client.mutateResource({
        customerId: managedAccount.adsAccountId,
        resource: 'campaigns',
        operation: 'remove',
        params: {
          resourceName: `customers/${managedAccount.adsAccountId}/campaigns/${campaign.campaignId}`,
        },
      });

      // Delete campaign from database
      await campaign.destroy();

      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

export default router;
