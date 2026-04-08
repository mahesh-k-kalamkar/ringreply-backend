const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const axios = require("axios");

// CREATE SESSION
router.post("/connect", auth, async (req, res) => {
  try {
    const response = await axios.post(
      "https://gate.whapi.cloud/instances/new",
      {},
      {
        headers: {
          Authorization: `Bearer ${process.env.WHAPI_TOKEN}`,
        },
      }
    );

    const data = response.data;

    await User.findByIdAndUpdate(req.user.id, {
      channelId: data.id,
      whapiToken: data.token,
      whapiStatus: "pending",
    });

    res.json({
      success: true,
      channelId: data.id,
      qr: data.qr,          // if available
      pairingCode: data.code // if available
    });

  } catch (err) {
    console.error(err.response?.data || err.message);

    res.status(500).json({
      message: err.response?.data || err.message,
    });
  }
});

router.get("/status", auth, async (req, res) => {
  const user = await User.findById(req.user.id);

  res.json({
    status: user.whapiStatus || "disconnected"
  });
});

module.exports = router;