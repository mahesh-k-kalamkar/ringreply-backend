const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const axios = require("axios");

// CREATE SESSION
router.post("/connect", auth, async (req, res) => {
  try {
    const response = await axios.post(
      "https://gate.whapi.cloud/instances",
      {},
      {
        headers: {
          Authorization: `Bearer ${process.env.WHAPI_TOKEN}`
        }
      }
    );

    const data = response.data;

    // Save channel info
    await User.findByIdAndUpdate(req.user.id, {
      channelId: data.id,
      whapiToken: data.token
    });

    res.json({
      message: "Session created",
      channelId: data.id
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/status", auth, async (req, res) => {
  const user = await User.findById(req.user.id);

  res.json({
    status: user.whapiStatus || "disconnected"
  });
});