# Coding Workshop - Frontend Code

## Overview

Project Tracker frontend: a React 19 + Vite app (plain JavaScript) with a sign-in
page and one workspace per role (admin, manager, employee). Every screen reads
and changes real data through the backend API.

## Prerequisites

- Node.js and npm
- React, React Router and lucide-react icons (installed with `npm install`)
- The backend API (locally: `bin/local-api.py`, see below)

## Structure

```
frontend/
├── public/                  # Static assets
├── src/
│   ├── main.jsx             # Entry: BrowserRouter, ToastProvider, global styles
│   ├── App.jsx              # Route table: /, /signup, /admin/*, /manager/*, /employee/*
│   ├── index.css            # Design tokens, reset, shared layout helpers
│   ├── services/            # The only code that talks to the API
│   │   ├── apiClient.js     # request() and api.get/post/put/delete, ApiError, token refresh
│   │   ├── session.js       # Signed-in user and tokens (localStorage)
│   │   ├── authApi.js       # One module per backend service, one small function per route:
│   │   ├── usersApi.js      #   users, projects (+ members), milestones (+ reviews),
│   │   ├── projectsApi.js   #   work logs, activity, notifications
│   │   ├── milestonesApi.js
│   │   ├── workLogsApi.js
│   │   ├── activityApi.js
│   │   ├── notificationsApi.js
│   │   └── portfolioApi.js  # Projects plus their milestones and members, for dashboards
│   ├── hooks/
│   │   ├── useApiQuery.js   # Load data: { data, error, loading, reload }; refreshQueries()
│   │   ├── useMutation.js   # Save data: submitting, fieldErrors, toast, reloads queries
│   │   ├── useNotifications.js  # The bell: list, unread count, mark read (polls every 30 s)
│   │   ├── useSession.js    # useSession() and useCurrentUser()
│   │   ├── useToast.js      # The app-wide toast (ToastProvider fills it in)
│   │   └── useModal.js, useDisclosure.js
│   ├── components/
│   │   ├── ui/              # Primitives (Button, Badge, DataTable, Modal…) plus
│   │   │                    #   LoadingState, ErrorState (Retry) and QueryContent
│   │   ├── layout/          # AppShell shared by all roles (sidebar, top bar, menus)
│   │   ├── dialogs/         # ConfirmDialog, FormDialog and their building blocks
│   │   ├── workspace/       # DIALOGS (every dialog kind) and WorkspaceDialogs (renders the open one)
│   │   ├── projects/        # Project tabs, summary cards, deadlines and project dialogs
│   │   ├── milestones/      # Dependency map, timeline, milestones tab and milestone dialogs
│   │   ├── users/           # Assignment list, role badge and user dialogs
│   │   ├── worklogs/        # WorkLogTable, project work logs tab and work log dialogs
│   │   ├── activity/        # ActivityList (audit trail)
│   │   └── auth/            # RequireRole
│   ├── pages/
│   │   ├── LoginPage.jsx, SignupPage.jsx
│   │   ├── admin/           # Admin workspace pages
│   │   ├── manager/         # Manager workspace pages and useManagerData
│   │   └── employee/        # Employee workspace pages and useEmployeeData
│   └── utils/               # Pure helpers: formatting, dates, schedule health,
│                            #   milestone/project/work log/activity rules
├── eslint.config.js         # ESLint configuration
├── index.html               # HTML entry
├── package.json             # Scripts and dependencies
└── vite.config.js           # Vite configuration
```

Each component imports its own stylesheet from the same folder.

## How data flows

- **Reading:** a page calls `useApiQuery(() => listProjects(), [])` and renders the
  result with `<QueryContent query={…}>`, which shows a spinner while loading and an
  error with a Retry button if the request fails. A response that arrives after the
  inputs changed is ignored.
- **Changing:** each dialog saves through `useMutation(createProject, { success, onSuccess })`.
  While it runs the form is disabled; the server's validation messages appear under
  the matching fields (`fieldErrors`); success or failure is shown in the toast; and
  every query on screen reloads, so all pages show the saved data.
- **Roles:** the backend enforces every rule. The UI hides or disables what a role
  can't do (for example, only admins create users and projects or abandon projects,
  and employees can't log work while their milestone is blocked or awaiting review).

## Signing in

Sign-in uses the backend's auth service: the access and refresh tokens are kept in
localStorage and refreshed automatically when they expire. Each role lands in its own
workspace; "Sign out" in the profile menu ends the session. When the database has no
users yet, `/signup` creates the first admin.

The sample data (`backend/db/seed.sql`) has one account per role, all with the
password `Password123!`:

| Username     | Role     | Opens       |
|--------------|----------|-------------|
| `aadmin1`    | admin    | `/admin`    |
| `mmanager2`  | manager  | `/manager`  |
| `eemployee3` | employee | `/employee` |

## Usage

### Local Development

Run the frontend against the local API server, which runs every backend service
without LocalStack. From the repository root:

```sh
backend/db/reset.sh                       # create the project_tracker database with sample data
.venv/bin/python bin/local-api.py         # API on http://localhost:3002
```

Then, in `frontend/`:

```sh
npm install
VITE_API_URL=http://localhost:3002 npm run dev   # http://localhost:3000
npm run lint     # ESLint
npm run build    # Production build into dist/
```

`VITE_API_URL` is where the API lives; without it, requests go to the site's own
origin (as when deployed). Restart `local-api.py` to pick up backend changes.

Or start the full local environment (databases, backend and frontend) from the
repository root:

```sh
./bin/start-dev.sh
```

To view your application, open the browser and navigate to `http://localhost:3000`.

### Cloud Deployment

To deploy your frontend to AWS:

```sh
./bin/deploy-frontend.sh
```

To view your application, open the browser and navigate to CloudFront URL.

## Clean Up

To remove all deployed resources (including frontend):

```sh
./bin/cleanup-environment.sh
```

**Warning**: This removes all infra resources. Cannot be undone.
