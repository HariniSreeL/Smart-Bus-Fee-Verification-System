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

CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
`);

const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
if (userCount === 0) {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(
    username, bcrypt.hashSync(password, 10)
  );
}

const studentCount = db.prepare("SELECT COUNT(*) AS count FROM students").get().count;
if (studentCount === 0) {
  const insertStudent = db.prepare(`
    INSERT INTO students (student_id, name, department, year, bus_number, bus_stop, total_fee)
    VALUES (@student_id, @name, @department, @year, @bus_number, @bus_stop, @total_fee)
  `);
  const insertPayment = db.prepare(`
    INSERT INTO payments (transaction_ref, student_id, amount, payment_date, recorded_by, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const students = [
    ["23IT045","Priya S","Information Technology","III Year","12","Erode",15000],
    ["23IT046","Kavin R","Information Technology","III Year","12","Perundurai",15000],
    ["23IT047","Nila M","Information Technology","III Year","08","Chennimalai",14000],
    ["23IT048","Arun K","Information Technology","III Year","08","Vijayamangalam",14000],
    ["23IT049","Divya P","Information Technology","III Year","15","Bhavani",16000],
    ["23IT050","Rahul V","Information Technology","III Year","15","Kavindapadi",16000],
    ["23IT051","Meena S","Information Technology","III Year","05","Gobichettipalayam",15500],
    ["23IT052","Santhosh M","Information Technology","III Year","05","Nasiyanur",15500]
  ];

  const seed = db.transaction(() => {
    for (const s of students) insertStudent.run({
      student_id:s[0], name:s[1], department:s[2], year:s[3],
      bus_number:s[4], bus_stop:s[5], total_fee:s[6]
    });
    insertPayment.run("TXN-DEMO-045","23IT045",15000,"2026-10-01","admin","Sample full payment");
    insertPayment.run("TXN-DEMO-046","23IT046",10000,"2026-09-18","admin","Sample partial payment");
    insertPayment.run("TXN-DEMO-048","23IT048",7000,"2026-09-20","admin","Sample partial payment");
    insertPayment.run("TXN-DEMO-049","23IT049",16000,"2026-10-03","admin","Sample full payment");
    insertPayment.run("TXN-DEMO-050","23IT050",5000,"2026-09-25","admin","Sample partial payment");
    insertPayment.run("TXN-DEMO-051","23IT051",15500,"2026-10-05","admin","Sample full payment");
  });
  seed();
}

export default db;
