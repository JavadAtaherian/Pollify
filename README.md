# Pollify

**Pollify** is a full-stack survey platform that lets you build custom surveys with conditional logic, distribute them via public links or embed them, collect responses (with optional login), view results with charts and tables, and export data to CSV.  
The backend is built with **Node.js/Express** and **PostgreSQL**, while the frontend is a **React** single-page application styled with **TailwindCSS**.

https://github.com/JavadAtaherian/Pollify.git

---

## ✨ Features

- **Survey Builder**
  - Add multiple questions (text, multiple choice, etc.)
  - Define **conditional logic** so questions appear based on earlier answers
  - Mark surveys as public or private
  - Optionally **require login** for respondents (based on email)

- **Response Collection**
  - Public survey links for participants
  - Optionally restrict to one response per email
  - Collect metadata (IP, user agent, timestamps)

- **Results Dashboard**
  - View response counts on survey cards
  - See responses in **tabular format**, including timestamps per question
  - Visualize results with **charts**
  - Export full dataset (including response times) to **CSV**

- **Authentication**
  - Admin signup/login with password hashing (PBKDF2)
  - Each admin manages their own surveys
  - JWT-based session authentication

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v16+
- [PostgreSQL](https://www.postgresql.org/) 13+
- npm or yarn package manager

### 2. Clone the repository
```bash
git clone https://github.com/yourusername/pollify.git
cd pollify/Pollify
```

### 3. Install dependencies
Backend:
```bash
cd server
npm install
```

Frontend:
```bash
cd ../client
npm install
```

### 4. Database Setup
Create a PostgreSQL database and run the schema:
```bash
psql -U <username> -d <yourdb> -f server/database/schema.sql
```

### 5. Configure Environment Variables
Create a .env file inside server/ with:
```bash
DATABASE_URL=postgres://user:password@localhost:5432/yourdb
JWT_SECRET=your_jwt_secret
PORT=5000
```

### 6. Run the app
Run backend:
```bash
cd server
npm start
```
Run frontend:
```bash
cd client
npm start
```
Or run:
```bash
npm run dev
```

Frontend will be served at http://localhost:3000 and backend at http://localhost:5000

### 📊 Usage

- Sign up as an admin and log in
- Create surveys with questions and optional conditional logic
- Share the survey link for participation
- View responses and charts in the dashboard
- Export survey results to CSV

### 🛠️ Tech Stack

- Frontend: React, TailwindCSS

- Backend: Node.js, Express

- Database: PostgreSQL

- Auth: JWT, PBKDF2 password hashing

## Screenshots:
![login](./screenshots/login.png)
![dashboard](./screenshots/dashboard.png)
![survey](./screenshots/survey.png)
![surveyResults](./screenshots/surveyResults.png)
![surveyBuilder](./screenshots/surveyBuilder.png)