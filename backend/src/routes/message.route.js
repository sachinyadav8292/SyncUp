const express = require("express");
const {
  getConversationsForSidebar,
  getMessages,
  getUsersForSidebar,
  sendMessage,
} = require("../controllers/message.controller.js");
const { protectRoute } = require("../middleware/auth.middleware.js");
const { upload } = require("../middleware/upload.middleware.js");

const router = express.Router();

// Apply auth protection middleware globally to all message endpoints
router.use(protectRoute);

router.get("/users", getUsersForSidebar);
router.get("/conversations", getConversationsForSidebar);
router.get("/:id", getMessages);

// Handles media attachment streams through multer before processing data structures
router.post("/send/:id", upload.single("media"), sendMessage);

// Fixed export to CommonJS format
module.exports = router;
