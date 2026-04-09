const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const whatsappController = require('../controllers/whatsappController');

// Protect all routes
router.use(auth);

// Main endpoint for Android app (Call Detection)
router.post('api/sendCallReply', whatsappController.sendCallReply);

module.exports = router;