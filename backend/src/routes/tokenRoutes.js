const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/authMiddleware');
const { joinQueue, listTokens, updateTokenStatus } = require('../controllers/tokenController');

router.post('/', joinQueue);
router.get('/', listTokens);
router.patch('/:id/status', requireAdmin, updateTokenStatus);

module.exports = router;
