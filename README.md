# Google Ads Management Application

This application allows users to manage Google Ads campaigns for multiple accounts through a centralized interface.

## Features

- Google OAuth authentication
- Connect and manage multiple Google Ads accounts
- Create and delete campaigns
- View campaign information
- Automatic database migrations

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0)
- Google Cloud Platform account with Google Ads API access
- Google OAuth 2.0 credentials

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd google-ads-manager
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
# Database
DB_HOST=localhost
DB_USER=user
DB_PASSWORD=password
DB_NAME=google_ads_db

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Session
SESSION_SECRET=your_session_secret

# Server
PORT=3000
NODE_ENV=development
```

4. Start MySQL using Docker:
```bash
docker-compose up -d
```

5. Run database migrations:
```bash
npm run migrate
```

6. Build and start the application:
```bash
npm run build
npm start
```

For development:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth flow
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/logout` - Logout user

### Managed Accounts
- `GET /api/managed-accounts` - List all managed accounts
- `GET /api/managed-accounts/connect` - Connect new Google Ads account
- `DELETE /api/managed-accounts/:id` - Remove managed account

### Campaigns
- `GET /api/campaigns/:managedAccountId` - List all campaigns for a managed account
- `POST /api/campaigns/:managedAccountId` - Create new campaign
- `DELETE /api/campaigns/:managedAccountId/:campaignId` - Delete campaign

## Database Schema

### Users
- id (Primary Key)
- googleId (Unique)
- email (Unique)
- name
- picture
- accessToken
- refreshToken
- createdAt
- updatedAt

### ManagedAccounts
- id (Primary Key)
- userId (Foreign Key)
- managedGoogleId
- managedEmail
- accessToken
- refreshToken
- adsAccountId
- createdAt
- updatedAt

### Campaigns
- id (Primary Key)
- managedAccountId (Foreign Key)
- campaignId
- name
- status
- budget
- startDate
- endDate
- createdAt
- updatedAt

## License

MIT 

// Локальная аутентификация
POST /auth/register - регистрация нового пользователя
POST /auth/login - вход в систему

// Google OAuth
GET /auth/google - начало процесса Google OAuth
GET /auth/google/callback - обработка callback от Google

// Управление аккаунтами
GET /api/managed-accounts - получение списка управляемых аккаунтов
GET /api/managed-accounts/add - добавление нового управляемого аккаунта
GET /api/managed-accounts/callback - обработка callback для нового аккаунта
DELETE /api/managed-accounts/:id - удаление управляемого аккаунта