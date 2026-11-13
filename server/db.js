
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseDir = path.join(__dirname, "database");
fs.mkdirSync(databaseDir, { recursive: true });

const db = new Database(path.join(databaseDir, "bus_fee.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'transport_officer',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  year TEXT NOT NULL,
  bus_number TEXT NOT NULL,
  bus_stop TEXT NOT NULL,
  total_fee REAL NOT NULL CHECK(total_fee >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_ref TEXT NOT NULL UNIQUE,
  student_id TEXT NOT NULL,
  amount REAL NOT NULL CHECK(amount > 0),
  payment_date TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES students(student_id)
);

CREATE INDEX IF NOT EXISTS idx_payments_student_id
ON payments(student_id);
`);

const userCount = db.prepare(
  "SELECT COUNT(*) AS count FROM users"
).get().count;

if (userCount === 0) {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  db.prepare(
    "INSERT INTO users (username, password_hash) VALUES (?, ?)"
  ).run(username, bcrypt.hashSync(password, 10));
}

// Demo student records
const students = [
  ["25ITR042", "HARINI SREE L", "12", "Erode", 15000],
  ["25ITR041", "HARINI P", "12", "Perundurai", 15000],
  ["25ITR033", "ESAIMOZHI M", "08", "Chennimalai", 14000],
  ["25ITR048", "INBARASI E", "08", "Vijayamangalam", 14000],
  ["25ITR021", "DHANUSHREE B M", "15", "Bhavani", 16000]
];

const insertStudent = db.prepare(`
  INSERT INTO students
  (student_id, name, department, year, bus_number, bus_stop, total_fee)
  VALUES (?, ?, 'Information Technology', 'II Year', ?, ?, ?)
  ON CONFLICT(student_id) DO UPDATE SET
    name = excluded.name,
    department = excluded.department,
    year = excluded.year,
    bus_number = excluded.bus_number,
    bus_stop = excluded.bus_stop,
    total_fee = excluded.total_fee
`);

const insertPayment = db.prepare(`
  INSERT OR IGNORE INTO payments
  (transaction_ref, student_id, amount, payment_date, recorded_by, note)
  VALUES (?, ?, ?, ?, 'admin', 'Demo payment record')
`);

const seedDemoData = db.transaction(() => {
  for (const student of students) {
    insertStudent.run(
  student[0], student[1], student[2], student[3], student[4]
);
  }

  // Demo payment records: paid, partial and pending
  insertPayment.run("DEMO-042", "25ITR042", 15000, "2026-10-01");
  insertPayment.run("DEMO-041", "25ITR041", 8000, "2026-10-02");
  insertPayment.run("DEMO-048", "25ITR048", 7000, "2026-10-03");
  insertPayment.run("DEMO-021", "25ITR021", 16000, "2026-10-04");
});

seedDemoData();

export default db;
