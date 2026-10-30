import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ message: "Enter username and password." });
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(String(username).trim());
  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({ message: "Invalid username or password." });
  }
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || "development-only-secret",
    { expiresIn: "8h" }
  );
  res.json({ token, user: { username: user.username, role: user.role } });
});

router.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));

export default router;
