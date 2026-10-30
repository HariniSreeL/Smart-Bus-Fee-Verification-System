import { Router } from "express";
import db from "../db.js";

const router = Router();

function studentWithPayment(studentId) {
  const student = db.prepare("SELECT * FROM students WHERE student_id = ?").get(studentId);
  if (!student) return null;
  const payment = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS amount_paid,
           MAX(payment_date) AS last_payment_date,
           COUNT(*) AS payment_count
    FROM payments WHERE student_id = ?
  `).get(studentId);
  const amountPaid = Number(payment.amount_paid);
  const balance = Math.max(Number(student.total_fee) - amountPaid, 0);
  const status = balance === 0 ? "PAID" : amountPaid > 0 ? "PARTIALLY PAID" : "PENDING";
  return { ...student, amount_paid: amountPaid, balance, status,
    last_payment_date: payment.last_payment_date, payment_count: payment.payment_count };
}

router.get("/", (req, res) => {
  const q = String(req.query.q || "").trim();
  const status = String(req.query.status || "").trim().toUpperCase();
  const rows = db.prepare(`
    SELECT s.student_id FROM students s
    WHERE (? = '' OR s.student_id LIKE ? OR s.name LIKE ? OR s.bus_stop LIKE ? OR s.bus_number LIKE ?)
    ORDER BY s.student_id
  `).all(q, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  let result = rows.map(r => studentWithPayment(r.student_id));
  if (["PAID","PENDING","PARTIALLY PAID"].includes(status)) result = result.filter(s => s.status === status);
  res.json({ students: result });
});

router.get("/:studentId", (req, res) => {
  const student = studentWithPayment(req.params.studentId.trim());
  if (!student) return res.status(404).json({ message: "Student not found. Check the ID or QR code." });
  res.json({ student });
});

export default router;
