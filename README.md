# Smart Bus Fee Verification System

A full-stack college project prototype using React + Vite, Node.js + Express, and SQLite.

## Features
- Transport officer login (JWT authentication)
- Dashboard with live student/payment summaries
- Camera-based QR scanning using `html5-qrcode`
- Student lookup by scanned QR / Student ID
- Student profile with bus details, total fee, amount paid, balance and status
- Student search and payment-status filters
- Payment history and manual payment recording by an authenticated officer
- Reports with collection and outstanding totals
- Sample student and payment records seeded automatically
- Responsive Soft Lavender, White and Navy UI

## Important project limitations
- This is a working academic prototype with fictional sample records.
- QR codes contain only a Student ID. They do not contain payment data.
- Payment status is calculated from payment transactions stored in SQLite.
- Recording a payment in this prototype is an administrative record entry, **not an online payment gateway transaction**. In a real deployment, verify the actual bank/payment gateway transaction before recording it.
- Camera access generally requires `localhost` or HTTPS and browser permission.
- Change the demo credentials and JWT secret before any real deployment.

## Requirements
- Node.js 22 or later
- npm
- VS Code
- Google Chrome (recommended)

## Run the project

Open a terminal in this folder.

### 1. Start backend
```bash
cd server
npm install
cp .env.example .env
npm run dev
```
Backend: http://localhost:5000

On Windows PowerShell, if `cp` does not work:
```powershell
Copy-Item .env.example .env
```

### 2. Start frontend
Open a **second terminal** in the project root:
```bash
cd client
npm install
npm run dev
```
Frontend: http://localhost:5173

## Demo login
- Username: `admin`
- Password: `admin123`

## Sample QR codes
The Students page includes a QR button for each student. Open a student's QR card and scan it from the Scan page using the camera. You can also enter the Student ID manually.

Sample IDs:
- 23IT045
- 23IT046
- 23IT047
- 23IT048
- 23IT049
- 23IT050
- 23IT051
- 23IT052

## Payment status rules
- `PAID`: total paid is greater than or equal to total fee
- `PARTIALLY PAID`: total paid is greater than zero but less than total fee
- `PENDING`: no payment has been recorded

Balance is `max(total fee - total paid, 0)`.

## Database
SQLite database is created automatically at `server/database/bus_fee.db` when the backend starts. Sample data is inserted only when the database has no students. To reset sample data, stop the backend and delete `server/database/bus_fee.db`; it will be recreated on the next start.

## Suggested project demonstration
1. Login using the demo credentials.
2. Open Dashboard and explain the summary cards.
3. Open Students and view the sample student records.
4. Open a student's QR card.
5. Open Scan, allow camera access, and scan the QR code.
6. Explain the retrieved student/bus details and payment status.
7. Open Payments and demonstrate the transaction history.
8. Record a sample payment for a partially paid student and show the status updating.
9. Open Reports and explain collection and outstanding amounts.

## Production checklist
This prototype is not production-ready. Before real college use, add HTTPS, strong secrets, role-based access, audit logs, backups, privacy controls, validated official student data, and payment-gateway/bank reconciliation.
