const express = require('express');
const router = express.Router();
const GeoService = require('../services/GeoService');
const { authenticate } = require('../middleware/auth');

// Trouver des entités à proximité
router.get('/nearby', authenticate, async (req, res) => {
    try {
        const { lat, lon, radius = 10 } = req.query;
        
        if (!lat || !lon) {
            return res.status(400).json({
                success: false,
                error: 'Latitude et longitude requises'
            });
        }

        const entities = await GeoService.getEntitiesWithServices(
            parseFloat(lat),
            parseFloat(lon),
            parseFloat(radius)
        );

        res.json({ success: true, entities });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Calculer la distance entre deux points
router.get('/distance', authenticate, async (req, res) => {
    try {
        const { lat1, lon1, lat2, lon2 } = req.query;

        if (!lat1 || !lon1 || !lat2 || !lon2) {
            return res.status(400).json({
                success: false,
                error: 'Coordonnées requises'
            });
        }

        const distance = GeoService.calculateDistance(
            parseFloat(lat1),
            parseFloat(lon1),
            parseFloat(lat2),
            parseFloat(lon2)
        );

        res.json({ success: true, distance: Math.round(distance * 100) / 100, unit: 'km' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;