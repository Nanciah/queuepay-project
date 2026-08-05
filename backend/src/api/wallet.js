const express = require('express');
const router = express.Router();

// GET /api/wallet
router.get('/', async (req, res) => {
    try {
        // TODO: Récupérer le wallet
        res.json({ balance: 0, currency: 'Ar' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
