const axios = require('axios');
const WhatsAppSession = require('../models/WhatsAppSession');
const User = require('../models/User');

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
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || err.response?.data || err.message;
    res.status(status).json({ message });
  }
};

// 3. Send Call Reply (Called by Android App)
// exports.sendCallReply = async (req, res) => {
//   try {
//     const { caller_number, call_type } = req.body;
//     const userId = req.user.id;

//     const session = await WhatsAppSession.findOne({ 
//       user: userId, 
//       status: 'connected' 
//     });

//     if (!session) {
//       return res.status(400).json({ message: "No active WhatsApp session found" });
//     }

//     let message = "Hi, sorry we missed your call. How can we help you today?";
//     if (call_type === "incoming") message = "Thank you for calling us!";
//     if (call_type === "outgoing") message = "We tried calling you. Let us know when you're free.";

//     await axios.post(`${BASE_URL}/messages/text`, {
//       to: caller_number.replace('+', ''),
//       body: message
//     }, {
//       headers: { Authorization: `Bearer ${MAIN_TOKEN}` }
//     });

//     res.json({ success: true, message: "WhatsApp message sent silently" });
//   } catch (err) {
//     console.error("Send Message Error:", err.response?.data || err.message);
//     res.status(500).json({ message: err.message });
//   }
// };

exports.sendCallReply = async (req, res) => {
  try {
    const {
      caller_number,
      call_type,
      message,
      website_url,
      media_url,
      media_type
    } = req.body;

    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Authenticated user not found" });
    }

    const session = await WhatsAppSession.findOne({
      user: userId,
      status: 'connected'
    });

    if (!session) {
      return res.status(400).json({ message: "No active WhatsApp session found" });
    }

    const token = user.whapiToken || MAIN_TOKEN;
    if (!token) {
      return res.status(500).json({ message: "Missing WhatsApp API token on server" });
    }

    // 🧩 Build final message
    let finalMessage = message || "Hello!";
    if (website_url) {
      finalMessage += `\n${website_url}`;
    }

    const to = caller_number.replace('+', '');

    // 🚀 CASE 1: MEDIA MESSAGE
if (media_url && media_type) {
  // Whapi uses specific endpoints for each type, but the payload is flat
  const endpoint = media_type === "video"
    ? "/messages/video"
    : "/messages/image";

  await axios.post(`${BASE_URL}${endpoint}`, {
    to: to,
    media: media_url,        // ✅ Whapi expects "media": "URL STRING"
    caption: finalMessage    // ✅ caption at top level
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

    // 🚀 CASE 2: TEXT ONLY
    else {
      await axios.post(`${BASE_URL}/messages/text`, {
        to: to,
        body: finalMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    res.json({ success: true, message: "Message sent successfully" });

  } catch (err) {
    console.error("Send Message Error:", err.response?.data || err.message);
    res.status(500).json({ message: err.message });
  }
};