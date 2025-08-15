Pollify

Pollify is a full‑stack survey platform that lets you build custom surveys with conditional logic, distribute them via public links or embed them, collect responses (with optional login), view results with charts and tables, and export data to CSV. The backend is built with Node.js/Express and PostgreSQL, while the frontend is a React single‑page application styled with TailwindCSS.

Features

Survey Builder – Create surveys with multiple question types (text, textarea, radio buttons, checkboxes, dropdowns, rating/scale, date, email). Arrange questions, set required fields and validation rules.

Conditional Logic – Show, hide or skip questions based on answers to previous questions. Supports operators like equals, not equals, contains, greater than and less than.

Public Links – Each survey has a shareable URL (e.g. /survey/123) that participants can visit without logging in. Surveys can also require login and restrict multiple responses per email.

Admin Accounts – Sign up and log in as an admin to manage your own surveys. Admins can create, edit, activate/deactivate and delete surveys, and view responses. Each admin sees only their own surveys.

Response Collection – Participants can optionally provide an email (if required) when taking a survey. The platform stores individual answers along with timestamps.

Results Dashboard – View aggregated results using interactive charts (bar charts for multiple choice and numeric questions) and a detailed table showing each respondent’s answers and the time each answer was submitted.

CSV Export – Export all responses to a CSV file with a single click. The CSV includes meta fields (respondent email, IP address, start/completion times) and every question’s answer along with its timestamp.

Responsive UI – The frontend uses React, TailwindCSS and lucide-react icons for a clean, responsive interface.

Project Structure
Pollify/
├── client/            # React frontend (create‑react‑app)
│   ├── package.json   # Client dependencies and scripts
│   └── src/           # React components and TailwindCSS
├── server/            # Node.js/Express backend
│   ├── package.json   # Server dependencies and scripts
│   ├── database/      # SQL schema and sample data
│   ├── scripts/       # Setup script for database
│   ├── src/           # API routes, models, utilities
├── README.md          # This file
└── package.json       # Root package.json for convenience scripts

Backend

Express app configured in server/server.js.

PostgreSQL connection via the pg package (server/src/database.js).

Models: User, Survey, Question, QuestionCondition, SurveyResponse and QuestionAnswer.

Routes: /api/auth for admin signup/login, /api/surveys for managing surveys, /api/questions for CRUD on questions, /api/conditions for conditional logic, and /api/responses for starting surveys, submitting answers, viewing results and exporting CSV.

Conditional logic evaluation lives in server/src/utils/conditionalLogic.js.

Frontend

React app (create‑react‑app) in client/.

TailwindCSS for styling.

Main component App.js handles routing, state management and API calls.

Components for the dashboard, survey builder, conditional logic modal, take‑survey page and responses view with charts and tables.

A simple API helper encapsulates AJAX calls to the backend.

Prerequisites

Node.js (v14 or higher) and npm installed.

PostgreSQL installed and running.

[Optional] nodemon for hot reloading on the server side.

Installation & Setup

Clone the repository:

git clone https://github.com/your‑username/pollify.git
cd pollify/Pollify


Install backend dependencies:

cd server
npm install


Configure environment variables:

Create a .env file inside the server/ directory and define the following variables for connecting to your PostgreSQL database:

DB_HOST=localhost
DB_PORT=5432
DB_NAME=pollifyDB
DB_USER=your_db_username
DB_PASSWORD=your_db_password


You can also define PORT if you want the server to run on a different port (defaults to 5000).

Set up the database:

The project ships with a SQL schema and some sample admin/user data. Run the setup script to create the database tables:

npm run setup-db


This script executes server/database/schema.sql on the database specified in your .env. You may need to create the database manually beforehand (e.g. createdb pollifyDB) if it doesn’t exist.

Install frontend dependencies:

In a separate terminal window:

cd client
npm install


Run the development servers:

Backend:

cd server
npm start


The API will be served at http://localhost:5000/api.

Frontend:

cd client
npm start


The React app will be served at http://localhost:3000.

By default, the frontend expects the backend at http://localhost:5000. If you change ports, update the API_BASE constant in client/src/App.js accordingly.

Access the app:

Open your browser to http://localhost:3000. You’ll be prompted to sign up or log in as an admin. Once logged in you can start creating surveys.

Usage

Sign Up / Login: Create an admin account or log in with existing credentials. Credentials are stored hashed in the database.

Create a Survey:

Click “New Survey” from the dashboard.

Add questions of various types (text, multiple choice, rating, etc.).

Define conditional logic rules via the “Add Condition” modal to show or hide questions based on previous answers.

Configure survey settings: activate/deactivate the survey, require login to respond, and allow/disallow multiple responses per email.

Share Your Survey:

From the dashboard, click the gear icon on a survey card and choose “Copy Link” to copy a public URL. Anyone with this link can respond.

If “require login” is enabled, respondents must provide an email. Otherwise, they can answer anonymously.

Collect Responses:

Participants fill out the survey. Conditional logic dynamically hides or shows questions based on their answers.

Each answer is timestamped; responses can be partially saved and completed later if the survey allows multiple responses.

View Results:

In the dashboard, click “View Responses” on a survey card.

See a list of respondents (by email or anonymous).

Toggle to display a table of all answers with timestamps.

Toggle to display charts summarising multiple choice and numeric questions. Charts are computed client‑side but can be rendered with Chart.js or another library.

Export Data:

Click “Export CSV” on the responses page to download all response data. The CSV includes meta fields (respondent email, IP address, start/completion times) and two columns per question: one for the answer and one for the time the answer was submitted.

Extending / Customising

Charts: The built‑in bar charts are simple custom components. For richer visualisations, install a charting library such as react-chartjs-2 and replace the chart rendering logic with <Bar> or <Pie> components using the aggregated data returned from the API.

Authentication: The current implementation returns the user record upon successful login without tokens. To add stateless authentication, integrate JSON Web Tokens (JWT) in the /api/auth/login route and store the token in the client.

Email Verification & Invites: To send unique survey invitations or restrict access to certain users, implement an email service and verify tokens before allowing responses.

Excel Export: For Excel (.xlsx) exports, use a library like exceljs in the backend to build a workbook and send it as a file download. The current CSV export can serve as a starting point.

License

This project is provided for educational purposes and has no specific license specified. Feel free to adapt it for your own use.