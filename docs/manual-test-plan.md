# Manual Test Plan

A checklist for testing Project Tracker by hand. Each test says what to **do**, what you should **see**, and where the change should also show up for **other people**.

It uses the demo data loaded by `backend/db/reset.sh`. Work through it top to bottom: later sections build on earlier ones, and a section that needs a clean start says **Reset**.

---

## 0. Setup

**Start the app** from the repository root:

```sh
backend/db/reset.sh                         # seed + demo data (rerun any time to start over)
.venv/bin/python bin/local-api.py           # API on http://localhost:3002 (restart after backend changes)
cd frontend && VITE_API_URL=http://localhost:3002 npx vite --port 3010
```

Then open http://localhost:3010.

**Tips:**
- Use a **normal window** for one person and a **private window** for another, so you can watch both side by side. Each window keeps its own sign-in.
- After a change in one window, **refresh the other**. Notifications also refresh on their own every 30 seconds.
- Demo dates are relative to the day you reset. Below, "D" means the reset day, and the example dates assume a reset on **Wed Oct 14 2026**.
- Logging work only works on **weekdays**.

### The cast

Everyone's password is `Password123!`.

| Username | Person | Role | Reports to | Pay | Open projects |
|---|---|---|---|---|---|
| `aadmin1` | Alex Admin | Admin | — | — | — |
| `pshah4` | Priya Shah | Admin | — | — | — |
| `mmanager2` | Morgan Manager | Manager | — | — | manages **3** |
| `rchen5` | Riley Chen | Manager | — | — | manages **1** |
| `jpark6` | Jordan Park | Manager | — | — | manages **0** |
| `eemployee3` | Emery Employee | Employee | Morgan | $40/h ($320/day) | on **3** |
| `dbrooks8` | Devon Brooks | Employee | Morgan | $45/h ($360/day) | on **2** |
| `clopez7` | Casey Lopez | Employee | Morgan | $35/h ($280/day) | on **1** |
| `akim9` | Avery Kim | Employee | Riley | $30/h ($240/day) | on **1** |
| `brivera10` | Blake Rivera | Employee | Riley | $37.50/h ($300/day) | on **1** |
| `qpatel11` | Quinn Patel | Employee | Jordan | $34/h | on **0** |
| `treed12` | Taylor Reed | Employee (**archived**) | Riley | $32/h | — |

### The projects

| # | Project | Manager | Ends | Budget used | Health | Who's on which milestone |
|---|---|---|---|---|---|---|
| 1 | Customer Portal | Morgan | Dec 31 | 1% | On track | Emery → Design (**awaiting review**) |
| 2 | Mobile App Refresh | Morgan | D+7 (Oct 21) | **94%** | **Needs attention** (Build 2 days overdue) | Emery, Casey → Build (available); Devon → Store Release (**blocked**) |
| 3 | Data Warehouse Migration | Morgan | D+30 (Nov 13) | **118%** | **Urgent** (Data Load and Index Tuning overdue) | Emery, Devon → Data Load (**awaiting review**); Index Tuning unassigned |
| 4 | Support Portal | Riley | D+90 (Jan 12) | **35%** | **On track** | Avery → Knowledge Base, Blake → Chatbot (both available; Go Live needs both) |
| 5 | Vendor Onboarding | Morgan | ended | 27% | — | **abandoned**, not archived (admins only) |
| 6 | Legacy Billing Cleanup | Morgan | ended | 88% | — | **completed and archived** |
| 7 | Intranet Redesign | **none** | D+60 | 13% | — | **unarchived, needs a manager** (previously Riley) |

### Starting notifications (unread)

| Person | Unread |
|---|---|
| Morgan | 2 review requests: Design (Emery), Data Load (Devon) |
| Avery | 2: review accepted, moved to Knowledge Base |
| Devon | 1: milestone assignment changed (Store Release) |
| Blake | 1: removed from Intranet Redesign |
| Everyone else | 0 |

---

## 1. Sign-in and access

- [ ] **Sign in as each role** → you land on `/#/admin`, `/#/manager` or `/#/employee` (page URLs use `#`), and the top bar shows your name and job title.
- [ ] **Username capitals don't matter.** `RChen5` works.
- [ ] **Wrong password** → "Incorrect username or password."
- [ ] **Unknown username** → the same message.
- [ ] **Taylor** (`treed12`, archived) → the same message.
- [ ] **Empty fields** → "Enter your username." / "Enter your password.", under each field.
- [ ] **Refresh while signed in** → you stay signed in.
- [ ] **Profile menu → Sign out** → back to sign-in. The browser's Back button doesn't get you back in.
- [ ] **Wrong workspace:** as Emery, go to `localhost:3010/#/admin` → sent to `/#/employee`. As Riley, go to `/#/employee` → sent to `/#/manager`.
- [ ] **Signed out**, go to `/#/manager` → sent to sign-in.
- [ ] **Refresh on any page** (e.g. `/#/manager`) → you stay on it.
- [ ] **Sign-up is closed:** go to `/#/signup` → "This workspace is already set up."
- [ ] **Session refresh** *(optional, slow)*: stay signed in for 20+ minutes (the access token lasts 15), then click around → it still works.

**Sign-up when the system is empty** *(then Reset)*:
- [ ] Run `PGPASSWORD=postgres123 psql -h localhost -U postgres -d project_tracker -c "TRUNCATE users RESTART IDENTITY CASCADE"`.
- [ ] Refresh the sign-in page → "Create the admin account" appears. Fill it in → you're signed in as an admin with username first initial + last name + 1 (e.g. `rowner1`).
- [ ] Go to `/#/signup` again → closed. **Reset** afterwards.

---

## 2. What each person sees (fresh Reset)

**Projects:**
- [ ] **Alex and Priya:** all 7 projects, including abandoned, archived and the one needing a manager.
- [ ] **Morgan:** 3 (Customer Portal, Mobile App Refresh, Data Warehouse Migration). Not Support Portal, and none of the closed ones.
- [ ] **Riley:** only Support Portal. **Jordan:** none, with empty states on Dashboard, My Projects and Calendar (no errors or blank pages).
- [ ] **Emery:** 3 projects, with a **different milestone and status on each**.
- [ ] **Devon:** 2. **Casey, Avery, Blake:** 1 each. **Quinn:** none, with empty states.

**Money and pay:**
- [ ] Budgets, labor cost, hourly rates and salaries are visible to admins and to the employee's own manager. **Employees never see them**, not even their own salary.

**People:**
- [ ] **Morgan's My Employees:** Emery, Devon, Casey. **Riley's:** Avery, Blake. **Jordan's:** Quinn.
- [ ] **Admin Users page:** 11 active people. With the archived filter → Taylor too. Filtering by role or manager narrows the list.

**Other pages:**
- [ ] **Activity Log** (admins only) shows **21** entries, newest first, including Priya's and Alex's actions. Managers and employees have no such page.
- [ ] **Archive** (admins only) shows Legacy Billing Cleanup: Completed, with Morgan as the previous manager.
- [ ] **Notification bells** match the table above.

---

## 3. Two admins see the same thing

- [ ] **Priya** edits Support Portal's budget → **Alex** refreshes and sees the new budget. The Activity Log shows **Priya** as the actor, with before → after.
- [ ] **Alex** archives Vendor Onboarding (it's already abandoned, so this is allowed) → **Priya** sees it on the Archive page.
- [ ] Either admin can do what the other did. There's no "owner" admin.

---

## 4. People

**Creating** (as an admin, on Users):
- [ ] **Create an employee:** Sam Ortiz, `sam@example.com`, manager **Riley**, salary 62400.
  - The username is generated (`sortiz13`) and the user ID shows as `USR-0013`.
  - **Check as Riley:** Sam appears under My Employees.
- [ ] **Create a manager:** there are **no manager or salary fields**, because only employees have those.
- [ ] **Validation:**
  - an employee without a manager or salary → field errors
  - email `RILEY@example.com` → already in use (emails ignore capitals)
  - username `DBROOKS8` → taken
  - password under 8 characters → error
- [ ] **Money fields** (salary, project budget, hourly rate on Add workday): typing `100,000` or `$100,000` works and is tidied to `100,000` when you leave the field; letters can't be typed. The ▲▼ buttons and the arrow keys add/subtract **$10,000** (salary, budget) or **$1** (hourly rate), never below 0.

**Editing:**
- [ ] **Edit Casey's job title** → saved. Activity Log: `user.update` with before → after.
- [ ] **Reset Avery's password** to `NewPass123!` → Avery can only sign in with the new one. The Activity Log doesn't show the password. Change it back afterwards.

**Archiving and restoring:**
- [ ] **Taylor:** **Restore** → Taylor can sign in again. Riley's My Employees shows Taylor.
- [ ] **Archive Casey** → Casey can't sign in, disappears from Morgan's employees, and is removed from Mobile App Refresh's members. **Restore Casey.** Casey is back, but not on the project, since archiving removed the membership. Re-add Casey to Mobile App Refresh on Build for later sections.
- [ ] **Archive yourself** → not allowed.
- [ ] **Archive Morgan** → blocked: "Reassign Morgan Manager's employees to another manager before archiving them."

**Manager changes:**
- [ ] **Transfer Quinn from Jordan to Riley** (change manager):
  - Quinn gets "Reporting manager changed: You now report to Riley Chen."
  - **Check:** Riley's My Employees shows Quinn; Jordan's is empty.
- [ ] **Now Jordan has no employees and no projects:**
  - **Promote Quinn to Manager** → Quinn's manager and salary are cleared, and Quinn signs in to the manager workspace.
  - **Demote Jordan to Employee** (with a manager and salary) → it works, because Jordan has nothing to hand over. Jordan signs in to the employee workspace.
- [ ] **Demote Morgan** → blocked (Morgan has employees and projects).

**Manager limits:**
- [ ] **As Morgan:** you can edit Emery's details **and salary**, but **not role or manager**. You can't see Riley's people.
- [ ] **As Riley:** the same for Avery and Blake, and Morgan's people aren't visible.

---

## 5. Projects

**Creating** (as an admin):
- [ ] **Create** "Payments Revamp", manager **Riley** (or Quinn, if promoted in section 4), from today to 2 months away, budget 30000.
  - That manager gets "New project assigned", and it appears in their My Projects and on their Calendar.
- [ ] **Validation:**
  - name `support portal` → already taken (names ignore capitals)
  - end date before start date → field error
  - negative budget → error
  - an employee as manager → error

**Members** (as the project's manager):
- [ ] **Add one of your own employees** → they get "Added to project", and it appears in their My Projects.
- [ ] **Add them again** → "… is already on this project."
- [ ] **Another manager's employees** don't appear in the list. As an admin, anyone can be added.
- [ ] **Remove a member** → they get "Removed from project", and the project disappears for them.

**Milestones** (on Payments Revamp):
- [ ] **Add** "Prototype" (first month) and "Testing" (second month, needs Prototype) → Testing shows **Blocked**, Prototype **Available**.
- [ ] **Dates outside the project** → error.
- [ ] **Circular dependency:** make Prototype need Testing → rejected.
- [ ] **Assign an employee to Prototype** → they get "Milestone assignment changed".
- [ ] **Assign from the milestone dialog** (Milestones tab → Edit, or Add milestone): the **Assigned employees** list shows every project member and where they are now ("On this milestone", "Now on Build, so checking moves them here", "No milestone yet").
  - Check someone on another milestone → saved, they **move** here (one milestone per project) and get "Milestone assignment changed".
  - Uncheck someone on this milestone → they're left **without a milestone** (and can't log until reassigned).
  - Adding a milestone with people checked assigns them straight away.
  - A project with no members shows "No one is on this project yet." 
- [ ] **Delete Testing** (no history) → removed.
- [ ] **Delete a milestone with history** (e.g. Mobile App Refresh's Build) → blocked, with the reason.

**Editing:**
- [ ] **Shrink Customer Portal to end Nov 15** → error naming Frontend and Launch.
- [ ] **Morgan changes a budget** → saved, and the admin's Activity Log shows from → to.
- [ ] **A manager changing the project manager** → not possible (admin only).

**Riley can't see Morgan's work:**
- [ ] As Riley, try a link to one of Morgan's projects → not found.

---

## 6. Reviews and milestone flow

**Data Load: one review moves two people** (as Morgan):
- [ ] **Dashboard** → the review queue shows **Design (Emery)** and **Data Load (Devon)**.
- [ ] **Open Data Load → Keep open**, with feedback → Devon gets "Milestone kept open" plus the feedback. Data Load is **Available** again.
  - **Check as Devon *and* Emery:** they can now log on Data Warehouse Migration.
- [ ] **As Devon: Request review** again (from the **Dashboard** card or the project page) → Morgan is notified, and the confirmation says **today's 8 hours were logged**. **Check:** Devon's My Work Logs and Morgan's Work Logs show today on Data Load.
- [ ] **As Morgan: Accept**, with destination **Validation**:
  - Data Load becomes **Completed**.
  - **Both Emery and Devon** move to Validation, and each gets "Moved to Validation".
  - **Validation** changes from Blocked to **Available**.
  - Devon (the requester) also gets "Review accepted".
- [ ] **Activity Log** shows `review.accept` and `milestone.complete`: "Completed Data Load; 2 members moved to Validation."

**Design (Customer Portal):**
- [ ] **Keep open with feedback.** The feedback you typed is carried into the second dialog.
- [ ] **Emery** sees the feedback, and **Log work** is enabled on Customer Portal.
- [ ] **Emery requests review again → Morgan accepts with destination Backend API:**
  - Backend API **and** Frontend become Available.
  - Launch stays Blocked.

**Parallel branches (Support Portal, as Riley):**
- [ ] **Complete Knowledge Base** (directly, no destination):
  - Avery gets "Milestone completed: assignment needed" and has **no milestone**, so can't log.
  - **Go Live stays Blocked.**
- [ ] **Complete Chatbot** with destination **Go Live** → Go Live becomes **Available**, and Blake moves there.
- [ ] **Assign Avery to Go Live** → Avery can log again.

**Waiting on a blocked milestone:**
- [ ] **Devon on Store Release** (Mobile App Refresh) is blocked behind Build → no Log work there.
- [ ] **As Morgan, complete Build** with destination **Store Release**:
  - Emery and Casey move there.
  - Store Release becomes Available, so Devon, Emery and Casey can all log there.

**Requesting a review logs the day:**
- [ ] **Log today first, then request review** (same or another project) → the review goes through, and the message says today was already logged. No second log.
- [ ] **On a weekend** → Request review is disabled (hover: "Reviews can be requested on weekdays"); through the API → 409 `not_a_weekday`.
- [ ] **Dashboard cards:** each project card has **Request review**. It's disabled with a hover reason when blocked ("Waiting for prerequisites"), already waiting ("Awaiting review"), or completed. Clicking the rest of the card still opens the project.

**Rules:**
- [ ] **Completed milestones** can't be edited, reopened or added as prerequisites.
- [ ] **An employee** can't request review of a milestone they're not on.
- [ ] **The review history** on Mobile App Refresh's UX Design shows a "kept open" (with feedback) and then an "accepted".

---

## 7. Work logs

**Who can log today** (fresh Reset, on a weekday):

| Person | Expected |
|---|---|
| Emery | Can log on **Mobile App Refresh** (Build). Customer Portal and Data Warehouse Migration are awaiting review |
| Casey | Can log on Mobile App Refresh |
| Avery, Blake | Can log on Support Portal |
| Devon | **Can't log anywhere** (Store Release is blocked; Data Load is awaiting review) |
| Quinn | No projects, so nothing to log |
| Morgan, Riley | Managers have no Log work action |

**Employee logging:**
- [ ] **Emery logs today** on Mobile App Refresh:
  - My Work Logs shows 8 h, **without** rate or cost.
  - **Check as Morgan:** it's in Work Logs at $320, "Hours this week" goes up, and Mobile App Refresh's budget use goes up (about +1.4%).
  - **Check as Alex:** it's in Work Logs.
- [ ] **Emery logs again today** → "You've already logged work today."
- [ ] **One project per day:** after the Data Load review is accepted (section 6), Emery has two available milestones. After logging on one, logging on the other → blocked.
- [ ] **On a weekend** → "You can only log work on weekdays."

**Admin entries and corrections:**
- [ ] **Add a workday:** for Blake, on a weekday 6+ weeks ago, on Support Portal → Discovery.
  - It shows for Blake and Riley as entered by the admin / historical.
  - Casey already has one historical entry from Priya.
- [ ] **A future date or a weekend** → error.
- [ ] **A day Emery already logged** → "This employee already has a work log on that day."
- [ ] **Correct a log** (change its milestone or date) → the employee gets "Work log corrected". Activity: `work_log.correct` with before → after.

**The pay rate is saved per log:**
- [ ] **As Morgan, change Casey's salary to 83200** ($40/h). Old Casey logs stay at $280; a new log is $320. The project's cost = old + new.

**Filters with real volume:**
- [ ] **Admin Work Logs:** filtering by employee, project, or a date range narrows hundreds of entries correctly.

---

## 8. Budgets, schedule and dashboards

- [ ] **Budget usage:** Mobile App Refresh ≈ **94%** (near), Data Warehouse Migration ≈ **118%** (shown as **over budget**), Support Portal ≈ **35%**, Customer Portal ≈ 1%.
- [ ] **Push one over budget:** as Morgan, lower Mobile App Refresh's budget to 21,000 → it shows as over budget. Admin stat cards count it.
- [ ] **Health** compares milestones with their own end dates: **On track** = none overdue, **Needs attention** = 1 milestone past its end date and not completed, **Urgent** = 2+ overdue or the project is past its end date with work left. Projects with no milestones fall back to time elapsed.
  - Fresh reset: Mobile App Refresh **Needs attention**, Data Warehouse Migration **Urgent**, Support Portal and Customer Portal **On track**.
  - **Complete Build** (Mobile App Refresh) → it becomes **On track**, even though it's in its last week.
  - **Complete Data Load** (Data Warehouse Migration) → **Needs attention** (Index Tuning still overdue); complete Index Tuning too → **On track**.
  - **Edit a milestone's end date into the past** → health drops; move it back → recovers.
  - The Health filter on My Projects / Projects uses the same labels.
- [ ] **Calendar (month):** each project appears **only on its deadline**.
  - Morgan: Oct 21 (Mobile App Refresh), Nov 13 (Data Warehouse Migration), Dec 31 (Customer Portal).
  - Riley: Jan 12 (Support Portal).
  - Today is highlighted.
- [ ] **Calendar (timeline):** full date ranges for each project.
- [ ] **Manager "hours this week"** adds up the current Monday–Sunday across all their employees.
- [ ] **Admin stat cards** show real counts: users by role, open projects without a manager (**1**: Intranet Redesign), the oldest waiting review, over-budget projects.

---

## 9. Closing, archiving and unarchiving

- [ ] **Complete a project with unfinished milestones** → "These milestones aren't complete yet: …".
- [ ] **Managers can't abandon:** Morgan has no "Mark abandoned"; admins do.
- [ ] **Archive a running project** → Archive is disabled ("Mark the project completed or abandoned first").
- [ ] **Archive Vendor Onboarding** (abandoned) → it moves to Archive, showing "Abandoned".

**Unarchive Legacy Billing Cleanup:**
- [ ] It's reopened **In progress**, with **no manager and no members**, and completed milestones stay completed.
- [ ] The Activity Log shows the previous manager (Morgan) and status (completed).
- [ ] It now counts as needing a manager.

**Intranet Redesign** (already unarchived, needs a manager):
- [ ] It shows "previously managed by Riley".
- [ ] Assign **Riley** → Riley now manages **2** projects, sees it in My Projects and on the Calendar, and can add members (e.g. Blake back) and milestones.

**Completing a project:**
- [ ] Finish every milestone of Payments Revamp (section 5), then its manager marks it complete → it disappears for that manager and its members, and admins see it as Completed.

---

## 10. Notifications

- [ ] **The bell's dot and count** match unread notifications.
- [ ] **Click one** → it's marked read and opens the related project or milestone.
- [ ] **Mark all read** → 0, and it stays 0 after refresh.
- [ ] **Each person sees only their own.**

| Event | Who's notified | Title |
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

## 11. Activity Log (admins)

- [ ] **Every change** from the sections above appears, newest first, with who did it, their role at the time, and a sentence.
- [ ] **Filters** (person, role, action type) narrow the list.
- [ ] **Paging:** once there are more than 50 entries, **Newer / Older** appear and page correctly. Below 50, you see just "1–N of N".
- [ ] **Edits show before → after.**
- [ ] **Employees' own daily logs** don't appear (by design). Admin entries and corrections do.

---

## 12. API checks (Swagger or Postman)

See [api/README.md](api/README.md) for setup. Ids for reference:

| Kind | Ids |
|---|---|
| Projects | 1 Customer Portal, 2 Mobile App Refresh, 3 Data Warehouse Migration, 4 Support Portal, 5 Vendor Onboarding, 6 Legacy Billing Cleanup, 7 Intranet Redesign |
| Users | 1 Alex, 2 Morgan, 3 Emery, 4 Priya, 5 Riley, 6 Jordan, 7 Casey, 8 Devon, 9 Avery, 10 Blake, 11 Quinn, 12 Taylor |

- [ ] **As Riley,** `GET /api/projects/2` → **404** (not Riley's project).
- [ ] **As Avery,** `GET /api/projects/1` → **404**.
- [ ] **As Avery,** `POST /api/projects` → **403**.
- [ ] **As Morgan,** `POST /api/projects/2/abandon` → **403**.
- [ ] **As Morgan,** `GET /api/activity` → **403**.
- [ ] **As Morgan,** `GET /api/users/9` (Avery, Riley's employee) → **404**.
- [ ] **As an admin,** `DELETE /api/projects/1` (running) → **409** `project_not_closed`.
- [ ] **As Devon,** `POST /api/work-logs` with body `{"project_id": 2}` → **409** (blocked milestone).
- [ ] **No token** → **401** "Sign in to continue."
- [ ] **A made-up token** → **401** "Your session is invalid."
- [ ] **A refresh token used as an access token** → **401**.
- [ ] **Archive Avery,** then use Avery's old token → **401** "Your account is no longer active."
- [ ] **Bad JSON** → **400**. **Missing fields** → **400** with `fields`.
- [ ] **`DELETE /api/work-logs/1`** → **405**.
- [ ] **Employee responses** never include `budget`, `cost`, `hourly_rate` or `annual_salary`.

---

## 13. Look and feel

- [ ] **Phone width** → the sidebar collapses into a menu button, and pages stay usable.
- [ ] **Loading states** appear briefly. **Stop the API server** → a friendly error with **Retry**. Restart the server and click Retry → recovers.
- [ ] **Forms** disable their buttons while saving, and errors appear next to the field they're about.
- [ ] **Disabled buttons look disabled** (faded, "not allowed" cursor).
- [ ] **Keyboard:** Tab through dialogs, and Esc or Cancel closes them.

---

## Found a problem?

Note the **person**, the **page**, **what you did**, **what you expected** and **what happened**. If the screen went blank or something failed silently, include the browser console's red error (F12 → Console).
