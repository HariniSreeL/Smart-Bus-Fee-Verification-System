import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const totalStudents = db.prepare("SELECT COUNT(*) AS n FROM students").get().n;
  const paid = db.prepare(`
    SELECT COUNT(*) AS n FROM students s
    WHERE COALESCE((SELECT SUM(amount) FROM payments p WHERE p.student_id=s.student_id),0) >= s.total_fee
  `).get().n;
  const totals = db.prepare(`
    SELECT COALESCE(SUM(amount),0) AS collected FROM payments
  `).get();
  const fees = db.prepare("SELECT COALESCE(SUM(total_fee),0) AS expected FROM students").get();
  const collected = Number(totals.collected);
  const expected = Number(fees.expected);
  res.json({
    totalStudents, paidStudents: paid, pendingStudents: totalStudents - paid,
    totalFee: expected, collected, outstanding: Math.max(expected - collected, 0)
  });
});

export default router;
