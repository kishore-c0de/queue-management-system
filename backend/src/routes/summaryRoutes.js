const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/authMiddleware');
const { getTodaySummary } = require('../controllers/summaryController');

router.get('/today', requireAdmin, getTodaySummary);

module.exports = router;
