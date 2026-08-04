const express = require('express');
const router = express.Router();

// GET /api/users
router.get('/', async (req, res) => {
    try {
        // TODO: Récupérer les utilisateurs
        res.json({ users: [] });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Dans User.js, ajouter cette association
User.belongsTo(Entity, { 
    foreignKey: 'company_id', 
    as: 'company' 
});


// GET /api/users/:id
router.get('/:id', async (req, res) => {
    try {
        // TODO: Récupérer un utilisateur
        res.json({ user: null });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
