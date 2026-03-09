# Production environment workflow
@todo

# Development Workflow

## HTTPS Development Setup

The development environment uses HTTPS with self-signed certificates. Follow these steps for initial setup:

### Install mkcert
```bash
# Ubuntu/Debian
sudo apt install libnss3-tools
wget -O mkcert https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-v1.4.4-linux-amd64
chmod +x mkcert && sudo mv mkcert /usr/local/bin/

# macOS
brew install mkcert

# Windows
choco install mkcert
```

### Certificate Setup
```bash
# Install mkcert CA (one-time setup)
mkcert -install

# Generate certificates for localhost (run from project root)
mkdir -p frontend/certs
cd frontend/certs
mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost 127.0.0.1 ::1
```

### Certificate Management
```bash
# Check certificate validity
openssl x509 -in frontend/certs/localhost.pem -text -noout | grep -A 2 "Validity"

# Renew certificates (remove old certificates first)
rm frontend/certs/localhost*.pem
cd frontend/certs
mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost 127.0.0.1 ::1
cd ../..

# Uninstall mkcert CA (if needed)
mkcert -uninstall
```

## Starting Development Environment

```bash
# Start all services in development mode, using the dev environment file
docker compose -f docker-compose.dev.yml --env-file .env.dev up --build -d

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


### Making API Calls

All services should use the `ApiConfigService` to construct API URLs:

```typescript
import { ApiConfigService } from './api-config.service';

@Injectable({ providedIn: 'root' })
export class MyService {
  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService
  ) {}

  getData(): Observable<any> {
    // This will use BASE_API + '/data'
    return this.http.get(this.apiConfig.getApiUrl('/data'));
  }
}
```

#### API Config Service Methods

- `getApiUrl('/endpoint')`: Returns `BASE_API + '/endpoint'`
- `getBaseApi()`: Returns the base API URL

#### Development vs Production

- **Development**: Run `ng serve` (default configuration uses development environment)
- **Production**: Run `ng build --configuration production`