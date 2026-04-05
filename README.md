
# Table Top Planner

A web application for planning tabletop games festivals with a modern Angular frontend and Node.js/Fastify backend.

---
### Installation

### Prerequisites

**Docker and Docker Compose**
- [Docker Desktop (macOS/Windows)](https://www.docker.com/products/docker-desktop)
- [Docker (Linux)](https://docs.docker.com/engine/install/)

**Mkcert**

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install libnss3-tools
wget -O mkcert https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert && sudo mv mkcert /usr/local/bin/

# macOS
brew install mkcert

# Windows
choco install mkcert
```

**Then you can install the repo:**
```bash
git clone repo
cd tabletopplanner/
```

### Certificates setup

The application requires SSL/TLS certificates for HTTPS. This setup uses **self-signed certificates** generated with `mkcert`.

> ![Important]
> If you were to deploy this on a server to make it public, self-signed certificates would not be sufficient. It is required to make the appopriate setup with a Certificate Authority like *Let's Encrypt* to ensure production-level encryption.

```bash
# Install mkcert Certificate Authority (one-time)
mkcert -install
```

From the project root:
```bash
# Generate certificates for development
mkdir -p frontend/certs
cd frontend/certs
mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost 127.0.0.1 ::1
cd ../..
```

Creates: 
- `frontend/certs/localhost.pem` - Certificate file
- `frontend/certs/localhost-key.pem` - Private key file

*Renewing certificates (if necessary):*
```bash
# Remove old certificates
rm frontend/certs/localhost*.pem

# Generate new certificates
cd frontend/certs
mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost 127.0.0.1 ::1
```

#### Environment variables
   ```bash
   cd tabletopplanner
   cp .env.example .env.dev
   ```
   
   > [!Note]
   > Edit .env.dev if needed, but defaults are suitable for development
   > As for the production environment, copy the example into `.env` and adapt variables to your usage.

### Usage

 **Build and start development stack**

```bash
docker compose -f docker-compose.dev.yml --env-file .env.dev up --build -d
```
- **Frontend (HTTPS)**: https://localhost:4200
- **Backend API**: http://localhost:3000
- **Prisma Studio** (Database GUI): http://localhost:5555

---

 **Or build and start production stack**
```bash
docker compose -f docker-compose.prod.yml --env-file .env up --build -d
```
- **Frontend (HTTPS)**: https://localhost:${FRONTEND_PORT:-8443}
- **Backend API**: http://localhost:${BACKEND_PORT:-3000}

---
#### Database populating

Data files are provided to populate the database in `backend/prisma/data/`,using:
- `editeur.csv` - Game publishers/editors
- `jeu.csv` - Games information

**=> Running the Migration Script:**

**In Development**:
```bash
docker exec -it ttp-backend-dev npm run migrate:csv
```

**In Production**:
```bash
docker exec -it ttp-backend-prod node dist/scripts/migrate-csv-data.js
```

----
### Notes

#### **Development Docker Features**
 
The docker development environment uses volume mounts for live code reloading. The source code of both frontend and backend is mounted in their respective container (alongside the dependencies), allowing for live refreshes without rebuilding containers.

#### **Production Docker Features**

**Backend** (`Dockerfile.prod`):
- Stage 1: Builds and compiles TypeScript source
- Stage 2: Minimal runtime image with production dependencies only
- Automatically applies database migrations on startup

**Frontend** (`Dockerfile.prod`):
- Stage 1: Builds Angular app to static assets
- Stage 2: Nginx serves compiled app with SSL/TLS support
- Nginx reverse proxy routes `/api/*` requests to backend

> All services have health checks configured.

#### Future Areas for Improvement


The implemenation of this application is partial, as it lacks some core featurs: 
- CRUD of the tabletop "Games"
- CRUD of the Games "Editeurs"
- All the related workflow around registering a game as created by an editor
- aggregated view of the games by "classe tarifaire"