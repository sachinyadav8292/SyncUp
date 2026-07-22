async function checkAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return res.status(200).json(req.user);
}

// Fixed named export to CommonJS format
module.exports = { checkAuth };
