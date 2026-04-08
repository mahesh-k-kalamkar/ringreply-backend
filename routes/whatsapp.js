const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createSession, getQR } = require('../controllers/whatsappController');

router.use(auth);

router.post('/create-session', createSession);
router.get('/qr/:sessionId', getQR);

module.exports = router;