# Technology Stack

## Backend

- **Framework**: Laravel 12 (PHP 8.2+)
- **API**: GraphQL via Lighthouse (nuwave/lighthouse)
- **Database**: MySQL 8
- **ORM**: Eloquent
- **Authentication**: Bearer token-based auth (remember_token)

## Frontend

- **Framework**: React 19 with Vite
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v4
- **HTTP Client**: Axios
- **UI Libraries**: 
  - lucide-react (icons)
  - react-hot-toast / react-toastify (notifications)
  - Chart.js (data visualization)
  - jsPDF + jspdf-autotable (PDF export)
  - xlsx (Excel export)

## Infrastructure

- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (reverse proxy for Laravel)
- **PHP Server**: PHP-FPM
- **Database Admin**: phpMyAdmin
- **Timezone**: Asia/Ho_Chi_Minh (UTC+7)

## Development Tools

- **Debugging**: Xdebug (port 9003)
- **Linting**: ESLint (frontend)
- **Code Quality**: Laravel Pint (backend)

## Common Commands

### Docker Operations
```bash
# Start all services
docker-compose up -d

# Rebuild containers
docker-compose up --build -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Access backend container
docker exec -it project-be bash
```

### Backend (Laravel)
```bash
# Inside backend container
composer install
php artisan key:generate
php artisan migrate
php artisan migrate:fresh --seed  # Reset database with seeders
php artisan cache:clear
php artisan config:clear

# Run tests
php artisan test
```

### Frontend (React)
```bash
# Inside frontend container or locally
npm install
npm run dev      # Development server
npm run build    # Production build
npm run lint     # Run ESLint
```

## Service Ports

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- GraphQL Playground: http://localhost:8000/graphql
- phpMyAdmin: http://localhost:8082
- MySQL: localhost:3307
- PHP-FPM: 9000
- Xdebug: 9003

## Environment Configuration

Backend uses `.env` file with key variables:
- Database connection (DB_HOST=db, DB_PORT=3306)
- App environment (APP_ENV, APP_DEBUG)
- GraphQL settings (LIGHTHOUSE_*)

Frontend uses `.env` file for API endpoints and feature flags.
