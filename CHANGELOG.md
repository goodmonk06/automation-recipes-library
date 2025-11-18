# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 3 - Deep Expansion & Production Readiness

#### Added
- **New Domain Entities**
  - `RecipeTemplate` - Reusable recipe patterns with variable substitution
  - `RecipeExecution` - Historical execution records with status tracking
  - `RecipeCollection` - Grouped recipes by category/use-case
- **Extensibility Framework**
  - `IStorageProvider` - Abstract storage interface (filesystem, S3, database)
  - `INotificationProvider` - Notification system integration
  - `IMetricsProvider` - Metrics collection interface
  - `IValidationProvider` - Custom validation rules
  - `PluginRegistry` - Centralized plugin management system
- **Event System**
  - `EventBus` - Domain event publisher/subscriber
  - Event types for recipe lifecycle (created, updated, deleted)
  - Event types for execution lifecycle
  - Event types for templates and collections
- **Observability**
  - Structured logging with `Logger` class
  - Correlation IDs for request tracing
  - Metrics collection framework
  - Log levels (DEBUG, INFO, WARN, ERROR, FATAL)
- **Template System**
  - Template loader with YAML persistence
  - Variable extraction from templates
  - Template instantiation with variable substitution
  - Create templates from existing recipes
- **Provider Implementations**
  - `InMemoryMetricsProvider` - Development metrics collector
  - `ConsoleNotificationProvider` - Console-based notifications
  - `NoOpNotificationProvider` - Silent notification provider
- **Documentation**
  - `docs/PHASE3_OVERVIEW.md` - Phase 3 implementation plan
  - `docs/ARCHITECTURE.md` - System architecture documentation
  - Comprehensive inline code documentation

#### Changed
- Enhanced type safety throughout the codebase
- Improved error messages with more context
- Better separation of concerns (layers)

### Phase 2 - CRUD & Production Foundation

#### Added
- Complete CRUD operations for recipes
- REST API with Express
- Centralized error handling middleware
- Zod validation for all inputs
- Docker support (Dockerfile + docker-compose.yml)
- Vitest testing framework with 28 tests
- Seed data with 5 realistic recipes
- ESLint configuration
- .env.example for environment variables
- Comprehensive README with Phase 2 structure

#### Changed
- Standardized npm scripts (dev, build, start, test, lint)
- Updated package.json with all dependencies
- Improved API response format (consistent success/error structure)

### Phase 1 - Initial Implementation

#### Added
- Basic recipe model with Zod validation
- Recipe loader (read-only operations)
- CLI tool for validation and listing
- TypeScript configuration
- Basic API server (GET endpoints only)
- Sample YAML recipes (Slack, Google Calendar)

## [0.1.0] - 2025-01-15

### Initial Release
- Core recipe management functionality
- YAML-based recipe storage
- Basic validation and loading
- CLI interface
- REST API (read operations)
