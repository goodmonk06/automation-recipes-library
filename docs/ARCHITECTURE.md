# Architecture Documentation

## Overview

The automation-recipes-library is built on a layered architecture that separates concerns between data models, business logic, API presentation, and extensibility.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API Layer (REST)                      │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐ │
│  │  Recipes   │  │ Templates  │  │   Collections    │ │
│  │  CRUD API  │  │    API     │  │      API         │ │
│  └────────────┘  └────────────┘  └──────────────────┘ │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────┐
│              Business Logic Layer                        │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐│
│  │ Recipe Loader │  │Template Loader│  │Event Handler││
│  │   Validator   │  │  Instantiator │  │   Manager   ││
│  └───────────────┘  └───────────────┘  └─────────────┘│
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────┐
│              Domain Model Layer                          │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │ Recipe  │  │ Template │  │Execution │  │Collection││
│  │ (Zod)   │  │  (Zod)   │  │  (Zod)   │  │  (Zod)  ││
│  └─────────┘  └──────────┘  └──────────┘  └─────────┘│
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────┐
│            Extensibility Layer                           │
│  ┌────────────┐  ┌─────────────┐  ┌────────────────┐ │
│  │  Providers │  │ Event Bus   │  │Plugin Registry │ │
│  │  (Storage, │  │ (DomainEvent│  │  (Lifecycle)   │ │
│  │Notification│  │  Publishing)│  │                │ │
│  │  Metrics,  │  │             │  │                │ │
│  │ Validation)│  │             │  │                │ │
│  └────────────┘  └─────────────┘  └────────────────┘ │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────┐
│              Persistence Layer                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │          File System (YAML)                          ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ ││
│  │  │ recipes/ │  │templates/│  │   collections/   │ ││
│  │  └──────────┘  └──────────┘  └──────────────────┘ ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. API Layer
**Responsibilities:**
- HTTP request handling
- Request validation
- Response formatting
- Error handling
- CORS, rate limiting (future)

**Key Components:**
- `httpServer.ts` - Express server setup
- `errorHandler.ts` - Centralized error handling

**Endpoints:**
- `/api/recipes` - Recipe CRUD
- `/api/templates` - Template management (Phase 3)
- `/api/collections` - Collection management (Phase 3)
- `/api/executions` - Execution history (Phase 3)

### 2. Business Logic Layer
**Responsibilities:**
- Recipe management logic
- Template instantiation
- Validation orchestration
- Event publishing

**Key Components:**
- `recipeLoader.ts` - Recipe CRUD operations
- `templateLoader.ts` - Template operations
- Event emission on state changes

### 3. Domain Model Layer
**Responsibilities:**
- Data structure definitions
- Schema validation (Zod)
- Business rules enforcement
- Domain-specific validations

**Key Components:**
- `recipe.ts` - Recipe entity and validation
- `recipeTemplate.ts` - Template entity
- `recipeExecution.ts` - Execution record
- `recipeCollection.ts` - Collection entity

### 4. Extensibility Layer
**Responsibilities:**
- Provider abstraction
- Plugin management
- Event distribution
- Logging, metrics

**Key Components:**
- `providers/` - Provider interfaces
- `events/DomainEvents.ts` - Event system
- `plugins/PluginRegistry.ts` - Plugin management
- `logger.ts` - Structured logging

### 5. Persistence Layer
**Responsibilities:**
- Data storage
- File I/O
- Query operations

**Current Implementation:**
- YAML file-based storage
- One file per recipe/template

**Future Options:**
- PostgreSQL via IStorageProvider
- S3 for distributed storage
- In-memory for testing

## Data Flow

### Recipe Creation Flow
```
1. Client → POST /api/recipes
2. API validates request body (Zod)
3. API calls recipeLoader.createRecipe()
4. recipeLoader:
   - Validates recipe uniqueness
   - Validates recipe schema
   - Writes YAML file
5. Event published: recipe.created
6. Metrics recorded: recipe.created counter
7. Notification sent (if configured)
8. API returns 201 with recipe data
```

### Template Instantiation Flow
```
1. Client → POST /api/templates/:id/instantiate
2. API loads template
3. API calls templateLoader.instantiateFromTemplate()
4. templateLoader:
   - Validates required variables
   - Applies default values
   - Substitutes variables in template
   - Validates resulting recipe
5. Returns instantiated recipe (not saved)
6. Client can save via POST /api/recipes
```

## Event System

### Event Types
- `recipe.created` - New recipe created
- `recipe.updated` - Recipe modified
- `recipe.deleted` - Recipe removed
- `template.created` - New template created
- `template.instantiated` - Template used to create recipe
- `execution.started` - Recipe execution began
- `execution.completed` - Recipe execution finished
- `execution.failed` - Recipe execution failed

### Event Flow
```
Domain Operation → Event Published → EventBus →
  → Metrics Provider (record metrics)
  → Notification Provider (send notifications)
  → Custom Handlers (user-defined)
```

## Plugin System

### Provider Types
1. **IStorageProvider** - Abstract storage backend
2. **INotificationProvider** - Send notifications
3. **IMetricsProvider** - Collect metrics
4. **IValidationProvider** - Custom validation rules

### Plugin Registration
```typescript
import { pluginRegistry } from './lib/plugins/PluginRegistry';
import { MyCustomStorageProvider } from './providers/MyStorage';

// Register provider
const storage = new MyCustomStorageProvider(config);
pluginRegistry.registerStorageProvider(storage);

// Use in application
const provider = pluginRegistry.getStorageProvider();
```

## Error Handling Strategy

### Error Levels
1. **Validation Errors** - 400 Bad Request
2. **Not Found** - 404 Not Found
3. **Conflict** - 409 Conflict (duplicate ID)
4. **Internal Errors** - 500 Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": { "field": "specificField" }
  }
}
```

## Logging Strategy

### Log Levels
- DEBUG - Detailed debugging information
- INFO - General informational messages
- WARN - Warning messages (recoverable)
- ERROR - Error messages (action failed)
- FATAL - Fatal errors (system crash)

### Structured Logging
All logs include:
- Timestamp
- Log level
- Message
- Context (key-value pairs)
- Correlation ID (for tracing requests)

```typescript
logger.info('Recipe created', {
  recipeId: 'my-recipe',
  author: 'user@example.com'
});
```

## Security Considerations

### Current (Phase 2/3)
- Input validation via Zod
- Safe file paths (no path traversal)
- Error messages don't leak internals

### Future Enhancements
- Authentication/Authorization
- API rate limiting
- Request signing
- Audit logging

## Performance Considerations

### Current Optimizations
- File-based storage is simple and fast for <1000 recipes
- In-memory caching for frequently accessed recipes (future)

### Scalability Path
1. **Horizontal Scaling**
   - Stateless API servers
   - Shared storage (S3/Database)
   - Load balancer

2. **Vertical Scaling**
   - Caching layer (Redis)
   - Database indexing
   - Connection pooling

## Testing Strategy

### Test Pyramid
```
      /\
     /E2E\
    /------\
   /Integr.\
  /----------\
 /   Unit     \
/--------------\
```

- **Unit Tests**: Domain models, validation, utilities
- **Integration Tests**: Loaders, API endpoints
- **E2E Tests**: Full workflows (future)

## Deployment Architecture

### Development
```
Local Machine → npm run dev → http://localhost:3000
```

### Production
```
Docker Container →
  App Process
  ├── recipes/ (volume mount)
  └── logs/

OR

Kubernetes Pod →
  App Container
  ├── recipes/ (PersistentVolume)
  └── Sidecar (metrics, logging)
```

## Future Architecture Enhancements

1. **Database Support**
   - PostgreSQL for recipes/templates
   - Full-text search
   - Complex queries

2. **Caching Layer**
   - Redis for frequently accessed recipes
   - Cache invalidation on updates

3. **Message Queue**
   - Event streaming (Kafka/RabbitMQ)
   - Async processing
   - Retry mechanisms

4. **Microservices Split**
   - Recipe Service (this repo)
   - Execution Service (separate)
   - Notification Service (separate)
   - API Gateway (routing)
