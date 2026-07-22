const path = require("path"); 
// Force Node to look exactly inside your backend subfolder for the .env configuration
require("dotenv").config({ path: path.resolve(__dirname, "../.env") }); 

const express = require("express");
const cors = require("cors");
const fs = require("fs");

const { clerkMiddleware } = require("@clerk/express");

const User = require("./models/user.model.js");
const { connectDB } = require("./lib/db.js");
const job = require("./lib/cron.js");

const clerkWebhook = require("./webhooks/clerk.webhook.js");
const authRoutes = require("./routes/auth.route.js");
const messageRoutes = require("./routes/message.route.js");
const { app, server } = require("./lib/socket.js");

const PORT = process.env.PORT || 5000;

const publicDir = path.join(process.cwd(), "public");

// Updated global CORS layout config to explicitly accept all production and preview Vercel channels
app.use(cors({ 
  origin: [
    "https://vercel.app",
    "http://localhost:5173"
  ], 
  credentials: true 
}));

// Mount raw webhook parsing configuration BEFORE express.json() can intercept it
app.use("/api/webhooks/clerk", express.raw({ type: "application/json" }), clerkWebhook);

// Mount global parsers and generic user identity authentication contexts
app.use(express.json());
app.use(clerkMiddleware());

// Mount API application route controllers
app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Serve static production client-side code fallback maps
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));

  app.get("*", (req, res, next) => {
    res.sendFile(path.join(publicDir, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

// Boot server process execution mapping pools
server.listen(PORT, () => {
  connectDB();
  console.log("Server is up and running on PORT:", PORT);

  if (process.env.NODE_ENV === "production") job.start();
});
