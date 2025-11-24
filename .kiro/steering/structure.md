# Project Structure

## Root Layout

```
/
├── be/              # Laravel backend
├── fe/              # React frontend
├── docker-compose.yml
└── README.md
```

## Backend Structure (`be/`)

### Core Architecture Pattern: Repository-Service-Resolver

The backend follows a layered architecture:

```
be/
├── app/
│   ├── GraphQL/
│   │   ├── Mutations/      # GraphQL mutation classes
│   │   ├── Queries/        # GraphQL query classes
│   │   ├── Resolvers/      # Field resolvers (main business logic entry)
│   │   └── Scalars/        # Custom scalar types
│   ├── Services/           # Business logic layer
│   ├── Repositories/       # Data access layer
│   ├── Models/             # Eloquent models
│   ├── Http/
│   │   ├── Controllers/    # REST controllers (if any)
│   │   └── Middleware/     # HTTP middleware (BearerTokenAuth, etc.)
│   ├── Helpers/            # Utility functions
│   └── Providers/          # Service providers
├── graphql/
│   ├── schema.graphql      # Main schema (imports all others)
│   ├── types/              # GraphQL type definitions
│   ├── queries/            # Query definitions
│   ├── mutations/          # Mutation definitions
│   └── inputs/             # Input type definitions
├── database/
│   ├── migrations/         # Database migrations
│   └── seeders/            # Database seeders
├── config/                 # Configuration files
├── routes/                 # Route definitions
└── tests/                  # PHPUnit tests
```

### Backend Conventions

- **Resolvers** (`app/GraphQL/Resolvers/`): Handle GraphQL field resolution, validate auth, delegate to services
- **Services** (`app/Services/`): Contain business logic, validation, transactions
- **Repositories** (`app/Repositories/`): Handle database queries, return Eloquent models/collections
- **Models** (`app/Models/`): Eloquent models with relationships, casts, soft deletes
- **GraphQL Schema**: Modular schema with imports, organized by feature

### Key Backend Patterns

1. **Authentication**: Bearer token via `BearerTokenAuth` middleware, stored in `users.remember_token`
2. **Authorization**: Role-based checks in resolvers/services (isAdmin(), isLecturer())
3. **Validation**: Laravel validators with Vietnamese error messages
4. **Transactions**: DB transactions in services for data consistency
5. **Soft Deletes**: Used on major entities (surveys, posts, etc.)
6. **Timestamps**: All models use `created_at`, `updated_at`, timezone-aware

## Frontend Structure (`fe/`)

```
fe/
├── src/
│   ├── api/
│   │   ├── graphql/        # GraphQL API functions by feature
│   │   │   ├── survey.js
│   │   │   └── post.js
│   │   ├── client.js       # Axios GraphQL client
│   │   └── graphql.js      # Generic GraphQL utilities
│   ├── components/         # Reusable React components
│   ├── pages/              # Page components (route targets)
│   │   └── admin/          # Admin-specific pages
│   ├── layouts/            # Layout components (MainLayout)
│   ├── utils/              # Utility functions
│   │   └── exports/        # Export utilities (CSV, PDF, Excel)
│   ├── assets/             # Static assets (images, CSS)
│   ├── icons/              # Icon components
│   ├── App.jsx             # Main app with routing
│   ├── main.jsx            # Entry point
│   └── graphqlClient.js    # GraphQL client setup
├── public/                 # Public static files
└── index.html              # HTML template
```

### Frontend Conventions

- **API Layer** (`src/api/graphql/`): Each feature has its own file with GraphQL queries/mutations
- **Components**: Functional components with hooks, organized by feature or reusability
- **Pages**: Top-level route components, typically fetch data and compose components
- **Protected Routes**: Use `ProtectedRoute` wrapper for authenticated pages
- **State Management**: Local state with useState/useEffect, no global state library
- **Styling**: Tailwind utility classes, custom CSS in `assets/css/` when needed

### Key Frontend Patterns

1. **GraphQL Requests**: Use axios to POST to `/graphql` endpoint
2. **Authentication**: Store token in localStorage, include in Authorization header
3. **Error Handling**: Try-catch with toast notifications for user feedback
4. **Routing**: React Router with nested routes under MainLayout
5. **Forms**: Controlled components with validation before submission
6. **Data Export**: Utilities for CSV, PDF, Excel generation from survey data

## Naming Conventions

### Backend (PHP/Laravel)
- Classes: PascalCase (`SurveyService`, `SurveyRepository`)
- Methods: camelCase (`getSurveyById`, `createSurvey`)
- Database tables: snake_case, plural (`surveys`, `survey_questions`)
- Database columns: snake_case (`created_at`, `question_text`)
- GraphQL types: PascalCase (`Survey`, `SurveyInput`)
- GraphQL fields: camelCase (`surveysMade`, `createdBy`)

### Frontend (JavaScript/React)
- Components: PascalCase (`SurveyForm`, `ProtectedRoute`)
- Files: Match component name (`SurveyForm.jsx`)
- Functions: camelCase (`getSurveyDetails`, `handleSubmit`)
- Constants: UPPER_SNAKE_CASE for true constants
- CSS classes: kebab-case or Tailwind utilities

## File Organization Rules

1. **Backend**: Group by layer (Resolvers, Services, Repositories), then by feature
2. **Frontend**: Group by type (components, pages, api), feature-based within
3. **GraphQL Schema**: Split by type (types, queries, mutations), import into main schema
4. **Tests**: Mirror the structure of the code being tested
5. **Migrations**: Timestamped, descriptive names (`2025_10_16_create_surveys_table`)

## Import/Export Patterns

### Backend
- GraphQL schema uses `#import` directive for modular schema files
- PHP uses namespaces and PSR-4 autoloading
- Services/Repositories injected via constructor dependency injection

### Frontend
- ES6 modules with named and default exports
- API functions exported as named exports
- Components typically use default export
- Utilities use named exports
