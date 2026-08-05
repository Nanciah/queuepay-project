const express = require('express');
const router = express.Router();

// GET /api/services
router.get('/', async (req, res) => {
    try {
        // TODO: Récupérer les services
        res.json({ services: [] });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/services/:id
router.get('/:id', async (req, res) => {
    try {
        // TODO: Récupérer un service
        res.json({ service: null });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
