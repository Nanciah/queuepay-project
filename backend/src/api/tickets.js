const express = require('express');
const router = express.Router();

// GET /api/tickets
router.get('/', async (req, res) => {
    try {
        // TODO: Récupérer les tickets
        res.json({ tickets: [] });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/tickets
router.post('/', async (req, res) => {
    try {
        // TODO: Créer un ticket
        res.status(201).json({ message: 'Ticket created' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/tickets/:id
router.get('/:id', async (req, res) => {
    try {
        // TODO: Récupérer un ticket
        res.json({ ticket: null });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
