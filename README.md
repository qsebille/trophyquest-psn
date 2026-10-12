# TrophyQuest PSN Fetcher

Minimal micro-service to **fetch PSN games & trophies** using [`psn-api`](https://www.npmjs.com/package/psn-api), and store them in **PostgreSQL**.

This project is designed to be run locally or deployed as AWS Lambda functions.

## 🚀 Features

- **Fetcher**: Fetches the entire game and trophy history for a specific PSN profile.
- **Refresher**: Updates data for all profiles already present in the database, based on the latest earned trophies.
- **PostgreSQL Support**: Optimized data insertion (players, games, editions, trophy suites, earned trophies).
- **Cloud Ready**: Designed to work on AWS Lambda or locally.

## 🛠 Prerequisites

- **Node.js** (v20+ recommended)
- **PostgreSQL** (accessible locally or remotely)
- **NPSSO Code**: Required for PSN authentication. You can obtain it by logging into [ca.account.sony.com](https://ca.account.sony.com/api/v1/ssocookie) and retrieving the `npsso` cookie value.

## ⚙️ Configuration

The project uses environment variables. Create a `.env` file at the project root:

```env
# PSN Authentication
NPSSO=your_npsso_code

# Database Configuration
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=trophyquest
PG_USER=your_user
PG_PASSWORD=your_password
PG_SSL=false

# Fetcher Configuration
PROFILE_NAME=your_psn_online_id
CONCURRENCY=5
```

| Variable       | Description                                            |
|:---------------|:-------------------------------------------------------|
| `NPSSO`        | PSN authentication token (mandatory).                  |
| `PG_HOST`      | PostgreSQL database host.                              |
| `PG_PORT`      | Database port (e.g., 5432).                            |
| `PG_DATABASE`  | Database name.                                         |
| `PG_USER`      | PostgreSQL user.                                       |
| `PG_PASSWORD`  | PostgreSQL password.                                   |
| `PG_SSL`       | Enable SSL for PostgreSQL (`true`/`false`).            |
| `PROFILE_NAME` | PSN Online ID to be processed by the fetcher.          |
| `CONCURRENCY`  | Number of concurrent requests allowed for the PSN API. |

## 📦 Installation

```bash
npm install
```

## 🏃 Usage

### Available Scripts

- **Build**: Compiles the TypeScript project into JavaScript.
  ```bash
  npm run build
  ```
- **Fetcher**: Runs the initial fetch for the profile defined in `PROFILE_NAME`.
  ```bash
  npm run start-fetcher
  ```
- **Refresher**: Updates existing profiles in the database.
  ```bash
  npm run start-refresher
  ```
- **Tests**: Runs unit tests.
  ```bash
  npm test
  ```

## ☁️ Deployment

The project includes handlers for AWS Lambda:
- **Fetcher**: `src/fetcher.ts` (handler: `handler`)
- **Refresher**: `src/refresher.ts` (handler: `handler`)

## 🏗 Project Structure

- `src/fetcher.ts`: Entry point for initial data fetching.
- `src/refresher.ts`: Entry point for incremental updates for all profiles in the database.
- `src/psn/`: Helpers for interacting with the PSN API.
- `src/postgres/`: Database insertion and selection logic.
- `src/models/`: TypeScript interfaces/models.
- `src/auth/`: PSN authentication logic.
- `src/config/`: Configuration and environment variable utilities.

## 📄 License

This project is licensed under the **ISC License**.
