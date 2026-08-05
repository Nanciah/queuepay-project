const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const FavoriteService = require('../services/FavoriteService');

// Ajouter un favori
router.post('/', authenticate, async (req, res) => {
    try {
        const { serviceId } = req.body;
        if (!serviceId) {
            return res.status(400).json({ success: false, error: 'Service ID requis' });
        }

        const result = await FavoriteService.addFavorite(req.user.id, serviceId);
        res.status(201).json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Supprimer un favori
router.delete('/:serviceId', authenticate, async (req, res) => {
    try {
        const removed = await FavoriteService.removeFavorite(req.user.id, req.params.serviceId);
        if (!removed) {
            return res.status(404).json({ success: false, error: 'Favori non trouvé' });
        }
        res.json({ success: true, message: 'Favori supprimé' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Obtenir les favoris de l'utilisateur
router.get('/', authenticate, async (req, res) => {
    try {
        const favorites = await FavoriteService.getFavorites(req.user.id);
        res.json({ success: true, favorites });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Vérifier si un service est favori
router.get('/check/:serviceId', authenticate, async (req, res) => {
    try {
        const isFavorite = await FavoriteService.isFavorite(req.user.id, req.params.serviceId);
        res.json({ success: true, isFavorite });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;