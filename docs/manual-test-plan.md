# Manual Test Plan

A checklist for testing Project Tracker by hand, role by role. Each test says what to **do**, what you should **see**, and where the change should also show up in **other roles**.

Work top to bottom. Later sections rely on state from earlier ones; where one needs a clean start, it says **Reset**.

---

## 0. Setup

**Start the app** from the repository root:

```sh
backend/db/reset.sh                                   # fresh sample data (rerun any time)
.venv/bin/python bin/local-api.py                     # API on http://localhost:3002
cd frontend && VITE_API_URL=http://localhost:3002 npx vite --port 3010
```

Then open http://localhost:3010.

**Accounts** (password `Password123!` for all):

| Username | Person | Role |
|---|---|---|
| `aadmin1` | Alex Admin | Admin |
| `mmanager2` | Morgan Manager | Manager of Emery and of Customer Portal |
| `eemployee3` | Emery Employee | Employee ($83,200/year, so $40/hour) |

**Starting data after a reset:**
- **Project:** Customer Portal, Oct 1 – Dec 31 2026, budget $50,000, managed by Morgan.
- **Milestones:**
  - Design (Oct): no prerequisites
  - Backend API (Nov): needs Design
  - Frontend (Nov – Dec 15): needs Design
  - Launch (Dec 16 – 31): needs Backend API **and** Frontend
- **Emery** is a member of Customer Portal, on Design, with work logged on Oct 1 and Oct 2 (8 h, $320 each, so 16 h and $640 in total).
- **Design** has a review request from Emery, waiting for a decision.
- **Morgan** has 1 unread notification: "Milestone review requested".

**Tips:**
- Use a **normal window** for one role and a **private window** for another, so you can watch both side by side. Each window keeps its own sign-in.
- After changing something in one window, **refresh the other** to see the change. Notifications also refresh on their own every 30 seconds.
- **"Today" is the real date.** Logging work only works on weekdays.

---

## 1. Sign-in and access

- [ ] **Sign in as each account** → you land on `/admin`, `/manager` or `/employee`, and the top bar shows your name and job title.
- [ ] **Username capitals don't matter.** `EEmployee3` works.
- [ ] **Wrong password** → "Incorrect username or password."
- [ ] **Unknown username** → the same message (it doesn't reveal which accounts exist).
- [ ] **Empty fields** → "Enter your username." / "Enter your password.", shown under each field.
- [ ] **Refresh the page while signed in** → you stay signed in.
- [ ] **Profile menu → Sign out** → back to the sign-in page. Pressing the browser's Back button doesn't get you back in.
- [ ] **Wrong workspace:** as Emery, type `localhost:3010/admin` in the address bar → you're sent to `/employee`. Same for Morgan → `/manager`.
- [ ] **Signed out**, open `localhost:3010/manager` → sent to sign-in.
- [ ] **Sign-up is closed:** open `/signup` → "This workspace is already set up."
- [ ] **Session refresh** *(optional, slow)*: stay signed in for 20+ minutes (the access token lasts 15), then click around → everything still works, because the token refreshes silently.

**Sign-up when the system is empty** *(then Reset afterwards)*:
- [ ] Run `PGPASSWORD=postgres123 psql -h localhost -U postgres -d project_tracker -c "TRUNCATE users RESTART IDENTITY CASCADE"`.
- [ ] The sign-in page now shows "Create the admin account" → fill the form → you're signed in as an admin. Your username is first initial + last name + 1 (e.g. `rowner1`).
- [ ] Try `/signup` again → closed. **Reset** afterwards.

---

## 2. What each role can see (fresh Reset)

| Check | Admin | Manager (Morgan) | Employee (Emery) |
|---|---|---|---|
| Customer Portal in project lists | ✓ | ✓ | ✓ |
| Budget and labor cost ($640 of $50,000) | ✓ | ✓ | **hidden** |
| Hourly rate / cost on work logs | ✓ | ✓ | **hidden** |
| Emery's salary | ✓ | ✓ (Emery is theirs) | not shown |
| Users page | ✓ all users | My Employees: only Emery | no such page |
| Activity Log | ✓ | no such page | no such page |
| Archive | ✓ | no such page | no such page |

- [ ] **Admin → Activity Log** shows the 5 starting entries: users created, project created, Emery assigned to Design, review requested.
- [ ] **Manager Dashboard** shows a review waiting for Design. The bell has 1 unread notification.
- [ ] **Employee → My Projects → Customer Portal:** "Your milestone" is Design. It's awaiting review, so **Log work is disabled**.

---

## 3. Users (Admin)

**Set up extra people** (later sections use them):
- [ ] **Users → create a manager:** Riley Ross, `riley@example.com`, any job title, role Manager. The username is generated (e.g. `rross4`) and the user ID shows as `USR-0004`.
  - There are **no manager or salary fields** for a manager: only employees have those.
- [ ] **Create an employee:** Jordan Lee, `jordan@example.com`, Employee, manager **Morgan**, salary 62400 (= $30/hour).

**Validation:**
- [ ] **Employee without a manager or salary** → errors under those fields.
- [ ] **Email `EMERY@example.com`** → "already in use" (emails ignore capitals).
- [ ] **Username `EEMPLOYEE3`** (if you type one) → taken.
- [ ] **Password under 8 characters** → error under the password field.

**Editing and moving people:**
- [ ] **Edit Jordan's job title** → saved. Activity Log shows `user.update` with the before → after values.
- [ ] **Transfer Jordan to Riley** (change manager):
  - Jordan gets the notification "Reporting manager changed: You now report to Riley Ross."
  - **Check:** Riley's My Employees shows Jordan; Morgan's no longer does.
  - Transfer Jordan **back to Morgan** for later sections.
- [ ] **Reset Emery's password** to `NewPass123!` → Emery can sign in with it (and not with the old one).
  - Activity says a password was reset, without showing the password.
  - Reset it back to `Password123!`.

**Archiving:**
- [ ] **Archive Jordan** → Jordan can't sign in ("Incorrect username or password"), and disappears from Morgan's My Employees.
  - **Restore Jordan** → can sign in again.
- [ ] **Archive Morgan** → blocked: "Reassign Morgan Manager's employees to another manager before archiving them."
- [ ] **Archive yourself (Alex)** → not allowed.

**Role changes:**
- [ ] **Promote Jordan to Manager:**
  - Jordan's manager and salary are cleared, and Jordan is removed from any projects.
  - Jordan now signs in to `/manager`.
  - **Then demote Jordan back to Employee** with manager Morgan and a salary.
- [ ] **Demote Morgan to Employee** → blocked: Morgan still has employees and projects.

**Manager limits** (sign in as Morgan):
- [ ] Morgan can edit Emery's details **and salary**, but **can't change Emery's role or manager**.
- [ ] Morgan can't see Riley's employees.

---

## 4. Projects (Admin, then Manager)

**Creating** (as Admin, on Projects):
- [ ] **Create:** Mobile App, manager Morgan, Oct 1 – Dec 31 2026, budget 30000.
  - **Morgan** gets "New project assigned".
  - **Check as Morgan:** it's in My Projects and on the Calendar.
- [ ] **Validation:**
  - name `customer portal` → already taken (names ignore capitals)
  - end date before start date → error under the end date
  - negative budget → error
  - an employee as manager → error

**Members** (as Morgan, on Mobile App → People):
- [ ] **Add Emery** → Emery gets "Added to project", and Mobile App appears in Emery's My Projects.
- [ ] **Add Emery again** → "Emery Employee is already on this project."
- [ ] **Jordan (Morgan's)** → can be added. **Riley's people** don't appear in the list. As Admin, anyone can be added.

**Milestones on Mobile App** (as Morgan):
- [ ] **Add** "Prototype", Oct 1 – Oct 31.
- [ ] **Add** "Testing", Nov 1 – Nov 30, needing Prototype. Testing shows **Blocked**; Prototype shows **Available**.
- [ ] **A milestone outside the project's dates** (e.g. Jan 2027) → error under the dates.
- [ ] **Circular dependency:** edit Prototype to need Testing → rejected (Testing already needs Prototype).
- [ ] **Assign Emery to Prototype** → Emery gets "Milestone assignment changed" and sees Prototype as their milestone on Mobile App.
  - Emery now has **two projects**, with one milestone on each.
- [ ] **Delete Testing** (no history yet) → it's removed. Add it back.
- [ ] **Delete Prototype after someone is assigned or has logged work** → blocked, with the reason.

**Editing:**
- [ ] **Shrink Customer Portal to end Nov 15** → error naming Frontend and Launch, which wouldn't fit.
- [ ] **Change the budget** → saved. The Admin's Activity Log shows the budget from → to.
- [ ] **As Morgan, change the manager** → not possible (admin only).

**Removing a member:**
- [ ] **Remove Jordan from Mobile App** (if added) → Jordan gets "Removed from project", and the project disappears from Jordan's view.

---

## 5. Review flow (Customer Portal; Reset first is easiest)

**Keep open:**
- [ ] **Emery:** Design is awaiting review → **Log work disabled**, and **Request review disabled** (one is already waiting).
- [ ] **Morgan:** open the review (Dashboard queue, or the bell notification). Type feedback, click **Keep open** → the feedback is carried into the second dialog → confirm.
  - Emery gets "Milestone kept open", with your feedback.
  - **Check as Emery:** Design is **Available** again, the feedback shows on the milestone, and **Log work is enabled**.
- [ ] **Emery: Request review** → Morgan gets "Milestone review requested · Emery Employee · Design".

**Accept:**
- [ ] **Morgan: Accept**, with destination **Backend API**:
  - Design becomes **Completed**.
  - Emery moves to Backend API, and gets "Moved to Backend API".
  - Emery also gets "Review accepted", with feedback if you wrote any.
  - **Backend API and Frontend** change from Blocked to **Available**. **Launch stays Blocked**: it needs both.
  - **Check as Emery:** their milestone is now Backend API, and they can log work.
  - **Check as Admin:** the Activity Log shows `review.accept` and `milestone.complete`.
- [ ] **Completed milestones can't be reopened or edited:** there's no edit for Design, and it can't be added as a prerequisite.

**Edge cases:**
- [ ] **Destination that's still blocked:**
  1. Complete Backend API (directly, as Morgan) with destination **Launch**.
  2. **Check:** Emery is on Launch, which is Blocked → Emery **can't log work** ("…while your milestone is blocked").
  3. Complete Frontend → Launch becomes Available → Emery can log.
- [ ] **No destination:** complete a milestone without choosing one → its employees get "Milestone completed: assignment needed" and have no milestone (they can't log until reassigned).
- [ ] **Not your milestone:** Emery can't request review on a milestone they're not on.

---

## 6. Work logs

**As Emery** *(weekday only)*:
- [ ] **Log today on Customer Portal** (needs an Available milestone):
  - It appears in My Work Logs as 8 h, **without** rate or cost.
  - **Check as Morgan:** it's in Work Logs with the $320 labor cost, "Hours this week" goes up, and the project's cost increases.
  - **Check as Admin:** it's in Work Logs.
- [ ] **Log again today** → "You've already logged work today."
- [ ] **Log today on Mobile App** too → blocked (**one project per day**).
- [ ] **On a Saturday or Sunday** → "You can only log work on weekdays."
- [ ] **Milestone awaiting review or blocked** → Log work disabled. Through the API, the error is "You can't log work while your milestone is …".

**Managers can't log:**
- [ ] **As Morgan** → no Log work action.

**As Admin, historical entries** (Work Logs → Add workday):
- [ ] **A past weekday for Emery** → it appears for Emery and Morgan marked as historical / entered by Alex Admin.
- [ ] **A future date** → error.
- [ ] **A weekend** → error.
- [ ] **A day Emery already logged** → "This employee already has a work log on that day."
- [ ] **Correct a log** (change its milestone or date):
  - Emery gets "Work log corrected", describing what changed.
  - The Activity Log shows `work_log.correct` with before → after.

**Pay rate is saved per log:**
- [ ] **As Morgan, change Emery's salary to 104000** ($50/hour).
  - **Check:** old logs still cost $320.
  - Log a new day as Emery → $400.
  - The project's total cost = old + new.

---

## 7. Closing, archiving and unarchiving projects

**Completing:**
- [ ] **Complete a project with unfinished milestones** → "These milestones aren't complete yet: …".
- [ ] **Complete every milestone of Mobile App, then Morgan marks it complete:**
  - **Check as Morgan and Emery:** Mobile App **disappears** (closed projects are hidden from them).
  - **Check as Admin:** it shows as Completed.
- [ ] **Managers can't abandon:** Morgan has no "Mark abandoned". Admin does.

**Archiving:**
- [ ] **Admin: Archive Customer Portal:**
  - It moves to **Archive**.
  - **Check as Morgan and Emery:** it's gone, and so are its work logs in their views.

**Unarchiving:**
- [ ] **Admin: Unarchive:**
  - The project is back **In progress**, with **no manager and no members**, and completed milestones stay completed.
  - It shows as needing a manager.
  - The Activity Log shows the previous manager and status.
- [ ] **Do the same with the completed Mobile App:** archive it, then unarchive it → it's reopened and can get a manager.
- [ ] **Assign a manager** (edit the project) → it reappears in that manager's My Projects. The manager can add members and milestones again.

---

## 8. Notifications

- [ ] **The bell's red dot and count** match the unread notifications.
- [ ] **Click a notification** → it's marked read and opens the related project or milestone.
- [ ] **Mark all read** → the count goes to 0. Refresh → it stays 0.
- [ ] **Notifications are private:** each person only sees their own.

**Who gets what:**

| Event | Who is notified | Title |
|---|---|---|
| Project created | its manager | New project assigned |
| Added to / removed from a project | the employee | Added to project / Removed from project |
| Milestone assignment changed | the employee | Milestone assignment changed |
| Review requested | the project's manager | Milestone review requested |
| Review decided | the requester | Review accepted / Milestone kept open |
| Milestone completed | everyone on it | Moved to … / Milestone completed: assignment needed |
| Manager changed | the employee | Reporting manager changed |
| Work log corrected | the employee | Work log corrected |

---

## 9. Activity Log (Admin)

- [ ] **Every change** from the sections above appears, newest first, with who did it, their role and a sentence.
- [ ] **Filters:** by person, role, action type → the list narrows. Pages of 50.
- [ ] **Edits show before → after** (e.g. budget 50,000 → 60,000).
- [ ] **Employees logging their own day** don't appear (by design). Admin historical entries and corrections do.

---

## 10. Dashboards and numbers

- [ ] **Schedule health** (green / amber / red) comes from how much of the project's dates have passed: 0–50% green, 50–75% amber, the last 25% red.
  - Customer Portal (Oct 1 – Dec 31) in mid-October is green.
  - Edit its dates to end soon → it turns red.
- [ ] **Budget usage** = labor cost ÷ budget. Lower the budget below the cost → it shows over budget.
- [ ] **Hours this week** (manager) counts only Monday–Sunday of the current week.
- [ ] **Admin stat cards** show real counts: users by role, open projects without a manager, the oldest waiting review, over-budget projects.
- [ ] **Manager Calendar** shows each project across its dates, with today highlighted.

---

## 11. API-level checks (Swagger or Postman)

See [api/README.md](api/README.md) for setup. These cover things the UI hides:

- [ ] **As Emery,** `POST /api/projects` → **403**.
- [ ] **As Morgan,** `POST /api/projects/{id}/abandon` → **403**.
- [ ] **As Morgan,** `GET /api/activity` → **403**.
- [ ] **As Emery,** `GET /api/projects/{id}` for a project they're not on → **404** (it isn't revealed).
- [ ] **No token** → **401** "Sign in to continue."
- [ ] **A made-up token** → **401** "Your session is invalid."
- [ ] **A refresh token used as an access token** → **401**.
- [ ] **Archive Emery,** then use Emery's old token → **401** "Your account is no longer active."
- [ ] **Bad JSON body** → **400**.
- [ ] **Missing fields** → **400**, with `fields` listing each problem.
- [ ] **`DELETE /api/work-logs/1`** → **405**: logs are never deleted.
- [ ] **Employee responses** never include `budget`, `cost`, `hourly_rate` or `annual_salary`.

---

## 12. Look and feel

- [ ] **Narrow the browser to phone width** → the sidebar collapses into a menu button, and pages stay usable.
- [ ] **Loading:** each page briefly shows a loading state.
  - Stop the API server and click around → a friendly error with **Retry**, not a blank page.
  - Start the API server again and click Retry → recovers.
- [ ] **Forms disable their buttons while saving.** Errors appear next to the field they're about.
- [ ] **Keyboard:** Tab through a dialog, and Esc or Cancel closes it.

---

## Found a problem?

Note the **role**, the **page**, **what you did**, **what you expected** and **what happened**. If the screen went blank or something failed silently, include the browser console's red error (F12 → Console).
