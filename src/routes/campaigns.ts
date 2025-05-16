import express from 'express';
import { google } from 'googleapis';
import models from '../models';

const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

// Get all campaigns for a managed account
router.get('/:managedAccountId', isAuthenticated, async (req, res) => {
  try {
    const campaigns = await models.Campaign.findAll({
      where: { managedAccountId: req.params.managedAccountId },
      include: [{ model: models.ManagedAccount, as: 'managedAccount' }],
    });
    res.json(campaigns);
  } catch (error) {
    console.error(error?.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new campaign
router.post('/:managedAccountId', isAuthenticated, async (req, res) => {
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

    const adsService = google.ads({
      version: 'v14',
      auth: auth,
    });

    // Create campaign in Google Ads
    const response = await adsService.customers.campaigns.create({
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
    const campaign = await models.Campaign.create({
      managedAccountId: managedAccount.id,
      campaignId: response.data.id,
      name: req.body.name,
      status: req.body.status,
      budget: req.body.budget,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
    });

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a campaign
router.delete('/:managedAccountId/:campaignId', isAuthenticated, async (req, res) => {
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

    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      access_token: campaign.managedAccount.accessToken,
      refresh_token: campaign.managedAccount.refreshToken,
    });

    const adsService = google.ads({
      version: 'v14',
      auth: auth,
    });

    // Delete campaign in Google Ads
    await adsService.customers.campaigns.delete({
      name: `customers/${campaign.managedAccount.adsAccountId}/campaigns/${campaign.campaignId}`,
    });

    // Delete campaign from database
    await campaign.destroy();

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
