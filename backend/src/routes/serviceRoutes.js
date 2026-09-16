const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/authMiddleware');
const { createService, listServices } = require('../controllers/serviceController');

router.get('/', listServices);
router.post('/', requireAdmin, createService);

module.exports = router;
