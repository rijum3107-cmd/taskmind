# TaskMind — Full-stack productivity app

A college-project starter app for managing tasks, priorities task, due dates, daily goals, progress insights and focus sessions based on user.

## Tech stack
- **Frontend:** HTML, CSS, vanilla JavaScript
- **Backend:** Node.js + Express REST API
- **Authentication:** bcrypt password hashing + JWT bearer tokens
- **Data storage:** JSON file created automatically at `data/db.json`

## Requirements
Install Node.js 18 or newer and Git. Use VS Code to open this project folder.

## Run the app in VS Code
1. Download and extract `TaskMind-FullStack-VSCode.zip`.
2. In VS Code select **File → Open Folder** and choose the extracted `TaskMind` folder.
3. Open **Terminal → New Terminal**.
4. Install dependencies: `npm install`
5. Start the backend: `npm run dev`
6. Open **http://localhost:3000** in your browser.
7. Choose **Create an account** and register. The server creates `data/db.json` automatically.

Keep the VS Code terminal running while using the app. Stop the server with `Ctrl+C`.

## Features
- Register and sign in
- Create, edit, complete, search, filter, and delete tasks
- Task priority and due dates
- Overview dashboard, schedule, and progress insights
- Focus timer (25, 15, and 5 minute presets)
- Daily goal and light/dark theme settings
- Responsive desktop and mobile layout
- Per-user API access control

## Basic Git and GitHub commands
Run these in the VS Code terminal from the TaskMind folder:

```bash
git init
git status
git add .
git commit -m "Initial commit"
git branch -M main
```

Create a new **empty** repository on GitHub, then connect it (replace `YOUR-USERNAME`):

```bash
git remote add origin https://github.com/YOUR-USERNAME/TaskMind.git
git push -u origin main
```

After making changes:

```bash
git status
git add .
git commit -m "Add task filters"
git push
```

## API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check API status |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current account/settings |
| GET | `/api/tasks` | List your tasks |
| POST | `/api/tasks` | Create a task |
| PATCH | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/stats` | Progress statistics |
| PATCH | `/api/settings` | Save settings |

## Important notes
- Passwords are stored as bcrypt hashes, not plain text. The browser stores a JWT for the signed-in session.
- `data/db.json` is local project data and is excluded from Git.
- For easy local setup, the server has a development JWT secret fallback. Before deploying, set a strong `JWT_SECRET` environment variable. Never commit real secrets.
- JSON-file storage is fine for a simple local college demo, but it is not intended for production or multiple simultaneous server instances. A managed database can be added later.
- The current app uses rule-based productivity features; it does not call an external AI service yet.

## Troubleshooting
- **`npm` is not recognized:** install Node.js LTS from https://nodejs.org, then restart VS Code.
- **Cannot open the app:** check that `npm run dev` is still running and visit `http://localhost:3000`.
- **Port 3000 is busy:** in PowerShell run `$env:PORT=3001; npm run dev`, then open `http://localhost:3001`.
- **Dependencies fail:** check your internet connection and retry `npm install`.
<<<<<<< HEAD
Title from main branch
=======
title from feature branch
>>>>>>> feature-docs
