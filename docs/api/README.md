# Trying the API

[`openapi.yaml`](openapi.yaml) describes every backend route: who may call it, what to send, and
what comes back. Load it into Swagger UI or Postman and you can click through the whole API
without writing any code.

## 1. Start the API

You need PostgreSQL running on `localhost:5432` (user `postgres`, password `postgres123`). The
setup scripts install it. Run these from the repository root:

```bash
# One-time: create the Python virtual environment
python3 -m venv .venv && .venv/bin/pip install -r backend/requirements-dev.txt

# Load fresh sample data (this wipes the project_tracker database)
backend/db/reset.sh

# Start every service on http://localhost:3002
.venv/bin/python bin/local-api.py
```

Leave it running. To check that it's up, run `curl http://localhost:3002/api/auth/setup` and you
should get `{"signup_open": false}`. If you change backend code, restart the server. To start
over with clean data, run `backend/db/reset.sh` again.

> Other servers in the spec: `http://localhost:3001` is the proxy in front of the LocalStack
> Lambdas (`./bin/start-dev.sh`, then `backend/db/reset.sh postgres`). The CloudFront one is
> for the deployed app; fill in your distribution's subdomain.

## 2. Sample accounts

All three use the password **`Password123!`**.

| Username     | Who            | Role     | Notes                                                |
| ------------ | -------------- | -------- | ---------------------------------------------------- |
| `aadmin1`    | Alex Admin     | admin    | Sees and manages everything                          |
| `mmanager2`  | Morgan Manager | manager  | Manages project 1, "Customer Portal", and Emery      |
| `eemployee3` | Emery Employee | employee | On Customer Portal, assigned to milestone 1 "Design" |

Customer Portal has four milestones: 1 Design, 2 Backend API, 3 Frontend, 4 Launch. Backend API
and Frontend need Design to be done first, and Launch needs both of them. Emery has already asked
for Design to be reviewed (review 1), so Design is `awaiting_review`.

## 3. Swagger UI (in the browser)

1. Open <https://editor.swagger.io>, choose **File → Import file**, and pick
   `docs/api/openapi.yaml`. You can also paste the file's contents into the left pane.
2. On the right, keep the server set to `http://localhost:3002`.
3. Open **auth → POST /api/auth/login**, click **Try it out**, pick an example from the
   **Examples** dropdown (admin, manager or employee), and click **Execute**.
4. Copy the `access_token` value from the response (without the quotes).
5. Click **Authorize** at the top, paste the token, then click **Authorize** and **Close**.
   Every other request now sends it.

"Try it out" runs in your own browser, so it can reach `localhost`. Tokens expire after
**15 minutes**. When you start getting `401 token_expired`, log in again and re-authorize.

If you prefer VS Code, the **OpenAPI (Swagger) Editor** extension by 42Crunch can show a
Swagger UI preview of the file.

## 4. Postman

1. Click **Import** and choose `docs/api/openapi.yaml`. Import it as a **Postman Collection**.
   Postman builds a folder per service with every request, including the example bodies.
2. Check the collection's **Variables** tab: `baseUrl` should be `http://localhost:3002`.
3. Open **auth → Sign in**, edit the body if you want a different account, and click **Send**.
   Copy `access_token` from the response.
4. Click the collection itself, then open its **Authorization** tab. Set **Type** to
   **Bearer Token** and paste the token into **Token**. Save it with Ctrl+S.
   Requests set to "Inherit auth from parent" now use it.
5. To switch user, log in as someone else and paste the new token into the same place.

## 5. A walkthrough

Each step says which account to authorize as. The examples in the spec already contain these
bodies.

**See how visibility differs**

1. *Each role:* `GET /api/projects`. All three see Customer Portal, but the employee's copy has
   no `budget` or `cost`.
2. *Employee:* `GET /api/work-logs`. Emery's two logs come back without `hourly_rate` or `cost`.
   As the manager, the same call includes them.
3. *Employee:* `GET /api/users/2` answers **404**: employees can only look themselves up. The
   API says "not found" rather than "forbidden" so it doesn't reveal who exists.

**Try something forbidden**

4. *Employee:* `GET /api/users` answers **403**, because only admins and managers can list people.
5. *Manager:* `PUT /api/projects/1` with `{"manager_id": 2}` answers **403**, because only an
   admin can reassign a project.
6. *Manager:* `PUT /api/projects/1` with the "tooShort" example answers **400**, and `fields`
   names the milestones that wouldn't fit the new dates.

**Review, accept, log work**

7. *Employee:* `POST /api/work-logs` with `{"project_id": 1}` answers **409
   `milestone_unavailable`**. Emery can't log work while Design is waiting for review.
8. *Manager:* `GET /api/notifications` shows "Milestone review requested".
9. *Manager:* `POST /api/milestones/1/reviews/1/decision` with the "accept" example. Design is
   completed and Emery moves to Backend API (milestone 2).
10. *Employee:* `GET /api/milestones?project_id=1`. Design is `completed`, Backend API is
    `available`, and Launch is still `blocked`.
11. *Employee:* `POST /api/work-logs` with `{"project_id": 1}` answers **201**. This only works
    on a weekday. Send it again and you get **409 `already_logged`**: one log per day.
12. *Employee:* `GET /api/notifications` shows "Review accepted", then try
    `POST /api/notifications/read-all`.
13. *Admin:* `GET /api/activity` lists everything that just happened.

## 6. One curl example

```bash
TOKEN=$(curl -s -X POST http://localhost:3002/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username": "mmanager2", "password": "Password123!"}' \
  | python3 -c 'import json, sys; print(json.load(sys.stdin)["access_token"])')

curl -s http://localhost:3002/api/projects/1 -H "Authorization: Bearer $TOKEN"
```

## When something goes wrong

Every error has the same shape: `{"error": {"code": "...", "message": "...", "fields": {...}}}`.

| Status | Usually means                                                                      |
| ------ | ---------------------------------------------------------------------------------- |
| 400    | Check `fields` for what to fix                                                     |
| 401    | No token, or it expired: log in again                                              |
| 403    | Your role, or the rules, don't allow it                                            |
| 404    | It doesn't exist, or you aren't allowed to see it                                  |
| 405    | The path exists, but not with that method (for example `DELETE /api/work-logs/1`)  |
| 409    | The data's current state blocks it; `code` and `message` say why                   |
