const express = require("express");
const { checkAuth } = require("../controllers/auth.controller.js");
const { protectRoute } = require("../middleware/auth.middleware.js");

const router = express.Router();

// Validates token session using protectRoute before parsing client verification states
router.get("/check", protectRoute, checkAuth);

// Fixed export to CommonJS format
module.exports = router;
