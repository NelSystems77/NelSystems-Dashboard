# NELSYSTEMS DASHBOARD - BACKEND API

## 📋 Descripción

Backend RESTful API construido con **Node.js + Express + PostgreSQL** para el sistema NelSystems Dashboard.

## 🏗️ Arquitectura

```
backend/
├── config/              # Configuraciones
│   ├── database.js     # PostgreSQL connection pool
│   └── logger.js       # Winston logger setup
├── controllers/         # Controladores de lógica de negocio
├── middlewares/         # Middlewares de Express
│   ├── auth.middleware.js    # JWT authentication
│   └── error.middleware.js   # Error handling
├── models/              # Modelos de datos
├── routes/              # Definición de rutas API
├── utils/               # Funciones de utilidad
├── migrations/          # Scripts SQL de migración
│   └── 001_initial_schema.sql
├── logs/                # Archivos de log
├── .env.example         # Variables de entorno ejemplo
├── package.json         # Dependencias del proyecto
└── server.js            # Punto de entrada del servidor
```

## 🚀 Instalación y Configuración

### Requisitos Previos

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 14.0
- **npm** >= 9.0.0

### 1. Instalar Dependencias

```bash
cd backend
npm install
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
# Editar .env con tus valores
```

Variables principales:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nelsystems_dashboard
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
JWT_SECRET=tu_secret_key_aqui
PORT=3000
```

### 3. Crear Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE nelsystems_dashboard;
```

### 4. Ejecutar Migraciones

```bash
# Opción 1: Manualmente
psql -U postgres -d nelsystems_dashboard -f migrations/001_initial_schema.sql

# Opción 2: Script npm
npm run migrate
```

### 5. Iniciar Servidor

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

El servidor estará disponible en: `http://localhost:3000`

## 📡 Endpoints de la API

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Iniciar sesión |
| POST | `/api/v1/auth/register` | Registrar usuario (solo admin) |
| GET | `/api/v1/auth/me` | Obtener usuario actual |
| POST | `/api/v1/auth/refresh` | Refrescar token |

### Clientes

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/clients` | Listar clientes | ✅ |
| GET | `/api/v1/clients/:id` | Obtener cliente | ✅ |
| POST | `/api/v1/clients` | Crear cliente | ✅ |
| PUT | `/api/v1/clients/:id` | Actualizar cliente | ✅ |
| DELETE | `/api/v1/clients/:id` | Eliminar cliente | ✅ Admin |

### Proyectos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/projects` | Listar proyectos | ✅ |
| POST | `/api/v1/projects` | Crear proyecto | ✅ |
| PUT | `/api/v1/projects/:id` | Actualizar proyecto | ✅ |
| DELETE | `/api/v1/projects/:id` | Eliminar proyecto | ✅ |

### Servicios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/services` | Listar servicios |
| POST | `/api/v1/services` | Crear servicio |
| PUT | `/api/v1/services/:id` | Actualizar servicio |
| DELETE | `/api/v1/services/:id` | Eliminar servicio |

### Dashboard

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/metrics` | Métricas generales |
| GET | `/api/v1/dashboard/revenue` | Ingresos |
| GET | `/api/v1/dashboard/upcoming` | Próximos vencimientos |

## 🔐 Autenticación JWT

### Login Request

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@nelsystems.com",
  "password": "123456789AiDyXm"
}
```

### Login Response

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@nelsystems.com",
    "name": "Administrador",
    "role": "admin"
  }
}
```

### Uso del Token

```bash
GET /api/v1/clients
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 Estructura de Datos

### Cliente (Client)

```json
{
  "id": "uuid",
  "name": "Acme Corporation",
  "company": "Acme Corp",
  "email": "contact@acme.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "status": "active",
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-15T10:30:00Z"
}
```

### Servicio (Service)

```json
{
  "id": "uuid",
  "client_id": "uuid",
  "name": "Hosting Premium",
  "type": "hosting",
  "billing_cycle": "monthly",
  "amount": 99.99,
  "currency": "USD",
  "start_date": "2026-01-01",
  "end_date": "2026-12-31",
  "status": "active",
  "auto_renew": true
}
```

## 🛡️ Seguridad

### Medidas Implementadas

1. **Helmet.js** - Headers de seguridad HTTP
2. **CORS** - Control de origen cruzado
3. **Rate Limiting** - Límite de requests por IP
4. **JWT** - Autenticación con tokens
5. **bcrypt** - Hash de contraseñas (12 rounds)
6. **express-validator** - Validación de inputs
7. **Prepared Statements** - Prevención de SQL injection

### Variables de Seguridad

```env
BCRYPT_ROUNDS=12
JWT_SECRET=cambiar_en_produccion
JWT_EXPIRES_IN=24h
RATE_LIMIT_MAX_REQUESTS=100
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

### Ejemplo de Test

```javascript
import request from 'supertest';
import app from '../server.js';

describe('GET /api/v1/clients', () => {
  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/v1/clients');
    expect(res.status).toBe(401);
  });

  it('should return clients with valid token', async () => {
    const token = 'valid_jwt_token';
    const res = await request(app)
      .get('/api/v1/clients')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
```

## 📝 Logging

Logs configurados con **Winston**:

- **Console**: Desarrollo (colorizado)
- **File**: Producción
  - `logs/error.log` - Solo errores
  - `logs/combined.log` - Todos los logs

## 🔄 Migraciones de Base de Datos

### Crear Nueva Migración

```bash
# Crear archivo en migrations/
touch migrations/002_add_field_to_clients.sql
```

```sql
-- migrations/002_add_field_to_clients.sql
ALTER TABLE clients ADD COLUMN tax_id VARCHAR(50);
```

### Ejecutar Migración

```bash
psql -U postgres -d nelsystems_dashboard -f migrations/002_add_field_to_clients.sql
```

## 📦 Deploy a Producción

### Opción 1: VPS (Ubuntu)

```bash
# 1. Instalar dependencias del sistema
sudo apt update
sudo apt install -y postgresql nodejs npm nginx

# 2. Clonar proyecto
git clone https://github.com/nelsystems/dashboard.git
cd dashboard/backend

# 3. Instalar dependencias
npm install --production

# 4. Configurar .env
nano .env

# 5. Migrar base de datos
npm run migrate

# 6. Iniciar con PM2
npm install -g pm2
pm2 start server.js --name "nelsystems-api"
pm2 save
pm2 startup
```

### Opción 2: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
docker build -t nelsystems-api .
docker run -p 3000:3000 --env-file .env nelsystems-api
```

### Opción 3: Heroku

```bash
# Instalar Heroku CLI
heroku create nelsystems-dashboard-api
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set JWT_SECRET=your_secret
git push heroku main
```

## 🔧 Variables de Entorno - Completas

```env
# Server
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nelsystems_dashboard
DB_USER=postgres
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=super_secret_key_change_this
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=https://dashboard.nelsystems.com

# Rate Limit
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@nelsystems.com
SMTP_PASSWORD=email_password

# Security
BCRYPT_ROUNDS=12
```

## 📚 Documentación API - Swagger

Accede a la documentación interactiva en:
`http://localhost:3000/api-docs`

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

© 2026 NelSystems. Todos los derechos reservados.

---

**Desarrollado con Node.js, Express y PostgreSQL siguiendo las mejores prácticas de la industria.**
