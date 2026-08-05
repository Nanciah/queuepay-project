const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const EmailService = require('../services/EmailService');
const SMSService = require('../services/SMSService');
const PushService = require('../services/PushService');

// Envoyer un email de test
router.post('/test-email', authenticate, async (req, res) => {
  try {
    const { email } = req.body;
    const result = await EmailService.sendTicketConfirmation(
      email || req.user.email,
      'TKT-TEST-001',
      'Service Test',
      '1ère position'
    );
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Envoyer un SMS de test
router.post('/test-sms', authenticate, async (req, res) => {
  try {
    const { phone } = req.body;
    const result = await SMSService.sendSMS(
      phone || req.user.phone,
      'Test SMS QueuePay'
    );
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Envoyer une notification push de test
router.post('/test-push', authenticate, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token push requis' });
    }
    const result = await PushService.sendPushNotification(
      token,
      'Test QueuePay',
      'Ceci est une notification de test'
    );
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;