import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function verifyAuthToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
}

export function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.slice(7);
  const payload = verifyAuthToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid token" });
  }

  req.user = payload;
  return next();
}

export function signAuthToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    config.jwtSecret,
    { expiresIn: "7d" }
  );
}
