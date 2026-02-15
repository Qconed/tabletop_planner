# Production environment workflow
@todo

# Development Workflow

```bash
# Start all services in development mode
docker compose -f docker-compose.dev.yml up --build -d

# Frontend: http://localhost:4200
# Backend: http://localhost:3000  
# Prisma Studio: http://localhost:5555
```

To have lighter images and enable live refreshes, the source code is mounted as volumes in development, as well as the dependencies, for both frontend and backend.


## DB Development Workflow

**Prisma migrations** track schema changes over time and between collaborators. **Migration files must be committed to git** so all team members share the same database schema

**Adding New Schema Changes**
1. Edit `backend/prisma/schema.prisma` with your changes
2. Create Migration from the inside of the container
```bash
docker exec -it ttp-backend-dev bash
npx prisma migrate dev --name describe_your_change # Create and apply new migration
```
3. Reload the prisma studio service `docker compose -f docker-compose.dev.yml restart prisma-studio` to see changes
> even though changes are applied directly to the database, the prisma studio does not have the features to live refresh after changes to the database schema
4. Commit to version control the migration files in backend/prisma/migrations/
> Note: in developpement, migrations should be done from the backend dev container, to avoid possibly interfering with the prod environment files that may contain the prod database URL.

**Applying Team changes to DB**
After pulling DB changes, restart the backend container with `docker compose -f docker-compose.dev.yml restart backend`. The migrations will apply automatically on container startup.

**Resetting DB schema (data destructive)**
```bash
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up --build
```
