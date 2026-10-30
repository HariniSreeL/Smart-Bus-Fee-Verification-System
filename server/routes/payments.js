import { Router } from "express";
import crypto from "node:crypto";
import db from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const rows = db.prepare(`
    SELECT p.id, p.transaction_ref, p.student_id, s.name AS student_name,
           p.amount, p.payment_date, p.recorded_by, p.note
    FROM payments p JOIN students s ON s.student_id = p.student_id
    ORDER BY p.payment_date DESC, p.id DESC
  `).all();
  res.json({ payments: rows });
});

router.get("/student/:studentId", (req, res) => {
  const rows = db.prepare(`
    SELECT transaction_ref, student_id, amount, payment_date, recorded_by, note
    FROM payments WHERE student_id = ? ORDER BY payment_date DESC, id DESC
  `).all(req.params.studentId);
  res.json({ payments: rows });
});

router.post("/", (req, res) => {
  const { student_id, amount, payment_date, note = "" } = req.body || {};
  const numericAmount = Number(amount);
  if (!student_id || !Number.isFinite(numericAmount) || numericAmount <= 0 || !payment_date) {
    return res.status(400).json({ message: "Student ID, valid amount and payment date are required." });
  }
  const student = db.prepare("SELECT * FROM students WHERE student_id = ?").get(String(student_id).trim());
  if (!student) return res.status(404).json({ message: "Student not found." });

  const currentPaid = db.prepare("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE student_id = ?")
    .get(student.student_id).total;
  if (numericAmount > Math.max(student.total_fee - currentPaid, 0)) {
    return res.status(400).json({ message: "Amount exceeds the student's remaining balance." });
  }
  const reference = `TXN-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  db.prepare(`
    INSERT INTO payments (transaction_ref, student_id, amount, payment_date, recorded_by, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(reference, student.student_id, numericAmount, payment_date,
    req.user.username, String(note).slice(0, 200));
  res.status(201).json({ message: "Payment record added successfully.", transaction_ref: reference });
});

export default router;
