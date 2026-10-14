# Coding Workshop - Backend Code

## Project Tracker backend

One Python Lambda per area, all backed by PostgreSQL:

| Service | URL | What it does |
| --- | --- | --- |
| `auth/` | `/api/auth` | Sign-in (JWT access + refresh tokens), first-admin sign-up, current user, change password |
| `users/` | `/api/users` | People, roles, reporting managers, salaries; archive/restore; password resets |
| `projects/` | `/api/projects` | Projects and their members; complete, abandon, archive, unarchive |
| `milestones/` | `/api/milestones` | Milestones, dependencies, completion, review requests |
| `work-logs/` | `/api/work-logs` | Daily 8-hour work entries with the pay rate saved on each |
| `activity/` | `/api/activity` | Audit trail of every change (admins only) |
| `notifications/` | `/api/notifications` | Each user's in-app notifications |

Other folders:

- `_shared/` — code every service uses (router, auth and role checks, validation, database, activity log). `bin/sync-backend-shared.sh` copies it into each service as `shared/` (each Lambda is packaged from its own folder); `start-dev.sh` and `deploy-backend.sh` run it for you. **Edit `_shared/`, never a service's `shared/` copy.**
  - `_shared/db.py` talks to PostgreSQL through [pg8000](https://pypi.org/project/pg8000/), a driver written in pure Python. Because it has no compiled code, the packages pip installs on your machine also load in the Lambdas, whatever Python version each one runs. Queries use `%s` placeholders, rows come back as dicts, and a broken unique, foreign-key or check constraint raises `db.UniqueViolation`, `db.ForeignKeyViolation` or `db.CheckViolation` with the constraint's name.
- `db/` — `schema.sql` (tables and the rules the database enforces), `seed.sql` (sample data), `reset.sh` (rebuilds a database from both).
- `_tests/` — pytest suite that calls each service's `handler()` against a throwaway database.

The full API reference is [docs/api/openapi.yaml](../docs/api/openapi.yaml), and [docs/api/README.md](../docs/api/README.md) explains testing it with Swagger UI, Postman or curl.

### Quick start (no LocalStack needed)

From the repository root:

```sh
python3 -m venv .venv && .venv/bin/pip install -r backend/requirements-dev.txt   # once
backend/db/reset.sh                         # rebuild the project_tracker database
.venv/bin/python bin/local-api.py           # all services on http://localhost:3002
VITE_API_URL=http://localhost:3002 npm run dev --prefix frontend
```

Sample accounts (local only): `aadmin1`, `mmanager2`, `eemployee3`, password `Password123!`.

### Tests

```sh
.venv/bin/pytest            # resets the project_tracker_test database for every test
```

### On LocalStack

`./bin/start-dev.sh` deploys every service as a Lambda. Those Lambdas use the database named `postgres`, so load it once with `backend/db/reset.sh postgres`.

## Overview

This folder contains backend services for CRUD operations with examples. Python with PostgreSQL are preferred, but Java and NodeJS with MongoDB options are available.

## Prerequisites

- Compute environment
    - AWS Lambda with Python Runtime and AWS SDK for Python (Boto3)
    - AWS Lambda with NodeJS Runtime and AWS SDK for JavaScript
    - AWS Lambda with Java Runtime and AWS SDK for Java
- Database environment
    - AWS Aurora for PostgreSQL-compatible database
    - AWS DocumentDB for MongoDB-compatible database

Predefined environment variables are injected into each backend service automatically, simplifying the need to manage them manually:

| Variable        | Description           | Local                  | Cloud                   |
| --------------- | --------------------- | ---------------------- | ----------------------- |
| `IS_LOCAL`      | Is it local or cloud? | `true`                 | `false`                 |
| `POSTGRES_HOST` | PostgreSQL hostname   | `localhost`            | AWS Aurora endpoint     |
| `POSTGRES_PORT` | PostgreSQL port       | `5432`                 | `5432`                  |
| `POSTGRES_NAME` | PostgreSQL name       | *(empty)*              | AWS Aurora database     |
| `POSTGRES_USER` | PostgreSQL username   | *(empty)*              | AWS Aurora username     |
| `POSTGRES_PASS` | PostgreSQL password   | *(empty)*              | AWS Aurora password     |
| `MONGO_HOST`    | MongoDB hostname      | `172.17.0.1` (Linux) / `host.docker.internal` (Mac/Windows) | AWS DocumentDB endpoint |
| `MONGO_PORT`.   | MongoDB port          | `27017`                | `27017`                 |
| `MONGO_NAME`    | MongoDB db name       | *(empty)*              | AWS DocumentDB database |
| `MONGO_USER`    | MongoDB username      | *(empty)*              | AWS DocumentDB username |
| `MONGO_PASS`    | MongoDB password      | *(empty)*              | AWS DocumentDB password |

> **Connection behavior:** When `IS_LOCAL` is `true`, the connection uses no TLS even if credentials are present (local MongoDB requires auth but not TLS). When `IS_LOCAL` is `false`, TLS is required for DocumentDB.

## Structure

The backend is organized into Lambda functions, one for each CRUD service:

```
coding-workshop-participant/
├── backend/                             # Backend services
│   ├── _examples/                         # Hello world examples
│   │   ├── java-service/                    # Backend service example for Java developers
│   │   │   ├── src/main/java/com/example/     # Path to Java package
│   │   │   │   ├── Handler.java               # Business logic using Java
│   │   │   │   ├── MongoService.java          # MongoDB connectivity service
│   │   │   │   └── PostgresService.java       # PostgreSQL connectivity service
│   │   │   └── pom.xml                        # Java configuration and dependencies
│   │   ├── nodejs-service/                  # Backend service example for NodeJS developers
│   │   │   ├── eslint.config.js               # ESLint JS tool configuration
│   │   │   ├── index.js                       # Business logic using NodeJS
│   │   │   ├── mongo-service.js               # MongoDB connectivity service
│   │   │   ├── package.json                   # NodeJS configuration and dependencies
│   │   │   └── postgres-service.js            # PostgreSQL connectivity service
│   │   └── python-service/                  # Backend service example for Python developers
│   │       ├── function.py                    # Business logic using Python
│   │       ├── mongo_service.py               # MongoDB connectivity service
│   │       ├── postgres_service.py            # PostgreSQL connectivity service
│   │       └── requirements.txt               # Python configuration and dependencies
│   └── README.md                        # Backend guide (YOU ARE HERE)
├── ...
```

## Adding a New Service

Place your service folder **directly under `backend/`** — one level deep:

```
backend/
├── my-service/          ✓ will be deployed
│   └── function.py
├── _examples/
│   └── my-service/      ✗ will NOT be deployed (underscore prefix)
│       └── function.py
└── group/
    └── my-service/      ✗ will NOT be deployed (too deep)
        └── function.py
```

Terraform auto-discovers services by looking for `function.py` (Python), `package.json` (Node.js), or `pom.xml` (Java) one level under `backend/`. Any folder prefixed with `_` is ignored.

## Usage

### Local Development

To run your application locally:

```sh
./bin/start-dev.sh
```

To test your code changes:

```sh
# Example: Get all records for {{service-name}}
curl -X GET https://localhost:3001/api/{{service-name}} \
     -H "Content-Type: application/json"
```

Replace `{{service-name}}` with corresponding service name
(e.g. `python-service`).

To tail logs in real-time:

```sh
# Example: Get logs for {{service-name}}
AWS_ENDPOINT_URL="http://localhost.localstack.cloud:4566" \
    aws logs tail /aws/lambda/{{function-name}} \
        --follow --format short --color on
```

Replace `{{function-name}}` with corresponding service name
(e.g. `coding-workshop-python-service-abcd1234`).

### Cloud Deployment

To deploy your backend to AWS:

```sh
./bin/deploy-backend.sh
```

To test your newly deployed code:

```sh
# Example: Get all records for {{service-name}}
curl -X GET https://{API_BASE_URL}/api/{{service-name}} \
     -H "Content-Type: application/json"
```

Replace `{{service-name}}` with corresponding service name
(e.g. `python-service`).

To tail logs in real-time:

```sh
# Example: Get logs for {{service-name}}
aws logs tail /aws/lambda/{{function-name}} \
    --follow --format short --color on
```

Replace `{{function-name}}` with corresponding service name
(e.g. `coding-workshop-python-service-abcd1234`).

## Clean Up

To remove all deployed resources (including backend):

```sh
./bin/cleanup-environment.sh
```

This will remove all AWS resources such as Lambda functions, CloudFront distributions, and much more.

**Warning**: This removes all infra resources. Cannot be undone.
