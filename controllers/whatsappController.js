const axios = require('axios');
const WhatsAppSession = require('../models/WhatsAppSession');

const BASE_URL = process.env.WHAPI_BASE_URL || 'https://gate.whapi.cloud';
const MAIN_TOKEN = process.env.WHAPI_TOKEN;

// 1. Create New Session
// Temporary Test Version
exports.createSession = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    // Use your existing channel ID for now
    const existingChannelId = "SUPRMN-GYF4R";   // ← Change to your actual Channel ID

    const session = await WhatsAppSession.create({
      user: userId,
      sessionId: existingChannelId,
      name: name || "My Business",
      status: 'connected'   // Assume it's already connected
    });

    res.json({ 
      success: true, 
      sessionId: existingChannelId,
      message: "Using existing channel. Now you can test sending messages." 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Get QR Code
exports.getQR = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const response = await axios.get(`${BASE_URL}/instances/${sessionId}/qr`, {
      headers: { Authorization: `Bearer ${MAIN_TOKEN}` }
    });

    res.json(response.data);
  } catch (err) {
    console.error("QR Error:", err.response?.data || err.message);
    res.status(500).json({ message: err.message });
  }
};

// 3. Send Call Reply (Called by Android App)
exports.sendCallReply = async (req, res) => {
  try {
    const { caller_number, call_type } = req.body;
    const userId = req.user.id;

    const session = await WhatsAppSession.findOne({ 
      user: userId, 
      status: 'connected' 
    });

    if (!session) {
      return res.status(400).json({ message: "No active WhatsApp session found" });
    }

    let message = "Hi, sorry we missed your call. How can we help you today?";
    if (call_type === "incoming") message = "Thank you for calling us!";
    if (call_type === "outgoing") message = "We tried calling you. Let us know when you're free.";

    await axios.post(`${BASE_URL}/messages/text`, {
      to: caller_number.replace('+', ''),
      body: message
    }, {
      headers: { Authorization: `Bearer ${MAIN_TOKEN}` }
    });

    res.json({ success: true, message: "WhatsApp message sent silently" });
  } catch (err) {
    console.error("Send Message Error:", err.response?.data || err.message);
    res.status(500).json({ message: err.message });
  }
};