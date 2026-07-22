const express = require("express");
const { Webhook } = require("svix"); // Recommended for explicit Express webhook body verification
const User = require("../models/user.model.js");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!signingSecret) {
      return res.status(503).json({ message: "Webhook secret is not provided" });
    }

    // 1. Get the svix headers from the request
    const headers = req.headers;
    const svix_id = headers["svix-id"];
    const svix_timestamp = headers["svix-timestamp"];
    const svix_signature = headers["svix-signature"];

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ message: "Missing svix headers" });
    }

    // 2. Extract the raw string payload safely out of the express.raw buffer
    const payload = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body);

    // 3. Initialize the Svix Webhook validator with your secret
    const wh = new Webhook(signingSecret);
    let evt;

    // 4. Verify payload authenticity directly 
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });

    // 5. Handle user lifecycle sync operations into MongoDB
    if (evt.type === "user.created" || evt.type === "user.updated") {
      const u = evt.data;

      // Extract the primary email address
      const email =
        u.email_addresses?.find((e) => e.id === u.primary_email_address_id)?.email_address ??
        u.email_addresses?.[0]?.email_address;

      // Compute display full name
      const fullName =
        [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || email?.split("@")[0];

      // Upsert into your database
      await User.findOneAndUpdate(
        { clerkId: u.id },
        { clerkId: u.id, email, fullName, profilePic: u.image_url },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
    }

    if (evt.type === "user.deleted") {
      if (evt.data.id) {
        await User.findOneAndDelete({ clerkId: evt.data.id });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error in Clerk webhook validation:", error.message);
    return res.status(400).json({ message: "Webhook verification failed" });
  }
});

// Fixed export to CommonJS format
module.exports = router;
