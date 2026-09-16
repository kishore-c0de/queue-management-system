// src/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

// Protects admin-only routes. Expects "Authorization: Bearer <token>".
function requireAdmin(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = payload; // { id, username, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAdmin };
