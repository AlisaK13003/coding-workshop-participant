# Coding Workshop - Frontend Code

## Overview

Project Tracker frontend: a React 19 + Vite app (plain JavaScript) with a sign-in
page and one workspace per role (admin, manager, employee). It currently runs on
sample data; the backend API will replace it.

## Prerequisites

- Node.js and npm
- React, React Router and lucide-react icons (installed with `npm install`)

## Structure

```
frontend/
├── public/                  # Static assets
├── src/
│   ├── main.jsx             # Entry: BrowserRouter + global styles
│   ├── App.jsx              # Route table: /, /admin/*, /manager/*, /employee/*
│   ├── index.css            # Design tokens, reset, shared layout helpers
│   ├── components/
│   │   ├── ui/              # Small primitives (Button, Badge, DataTable, Modal…) + index.js
│   │   ├── layout/          # AppShell shared by all roles (sidebar, top bar, menus)
│   │   ├── dialogs/         # ConfirmDialog, FormDialog and their building blocks
│   │   ├── milestones/      # DependencyDiagram, MilestoneTimeline, ReviewIcon
│   │   ├── worklogs/        # WorkLogTable with column presets
│   │   ├── projects/        # Project summary cards, budget/milestone progress, deadlines
│   │   ├── users/           # AssignmentList
│   │   └── activity/        # ActivityList (audit trail)
│   ├── pages/
│   │   ├── LoginPage.jsx    # Sign-in page
│   │   ├── admin/           # Admin workspace: pages, tabs, dialogs, config
│   │   ├── manager/         # Manager workspace: pages, calendar, dialogs, data hook
│   │   └── employee/        # Employee workspace: pages, tabs, dialogs, data hook
│   ├── data/                # Sample data per role (replaced by API calls later)
│   ├── services/            # Demo sign-in and demo cross-role sync (temporary)
│   ├── hooks/               # useModal, useToast, useNotifications, useDisclosure
│   └── utils/               # Pure helpers: formatting, schedule health, milestones, calendar
├── eslint.config.js         # ESLint configuration
├── index.html               # HTML entry
├── package.json             # Scripts and dependencies
└── vite.config.js           # Vite configuration
```

Each component imports its own stylesheet from the same folder.

## Demo sign-in

Until the backend login exists, sign-in is a demo (`src/services/demoAuth.js`).
Use one of these usernames (not case-sensitive) with any non-empty password:

| Username     | Opens       |
|--------------|-------------|
| `aadmin1`    | `/admin`    |
| `mmanager2`  | `/manager`  |
| `eemployee3` | `/employee` |

"Sign out" in the profile menu returns to the sign-in page. Manager and employee
actions (review requests, logged work, milestone changes) are shared through
localStorage in the same browser; clear site data to reset the demo.

## Usage

### Local Development

Run only the frontend:

```sh
npm install
npm run dev      # http://localhost:3000
npm run lint     # ESLint
npm run build    # Production build into dist/
```

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
