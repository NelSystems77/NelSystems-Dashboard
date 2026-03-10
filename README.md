# NelSystems Dashboard - Sistema de Gestión de Servicios SaaS

![Logo](./assets/images/logo-512.png)

## 📋 Descripción

**NelSystems Dashboard** es una Progressive Web App (PWA) profesional diseñada para gestionar todos los servicios SaaS que NelSystems provee a sus clientes. El sistema implementa las mejores prácticas de ingeniería de software, arquitectura limpia, principios SOLID y seguridad web.

## ✨ Características Principales

### 🔐 Autenticación y Seguridad
- Login seguro con hash de contraseñas
- Gestión de sesiones (24 horas de duración)
- Validación de inputs y sanitización
- Protección contra XSS
- Control de permisos por rol (admin/operator)

### 👥 Gestión de Clientes
- CRUD completo de clientes
- Información de contacto y empresa
- Historial completo de servicios
- Estados: activo, inactivo, suspendido

### 📁 Gestión de Proyectos
- Control de proyectos de software
- Asignación a clientes
- Estados del proyecto
- Fechas importantes y responsables

### 💼 Gestión de Servicios SaaS
- Registro de servicios (hosting, dominios, desarrollo, mantenimiento, licencias)
- Tipos de pago: mensual, trimestral, semestral, anual, único
- Control de fechas de vencimiento
- Estados: activo, vencido, cancelado, pendiente

### 🌐 Control de Dominios
- Gestión de dominios registrados
- Información de registrador y DNS
- Alertas de vencimiento configurables
- Auto-renovación

### 🖥️ Control de Hosting
- Gestión de planes de hosting
- Información de servidores y proveedores
- Control de renovaciones
- Datos de acceso (cPanel, FTP)

### 🔑 Control de Licencias
- Google Workspace, Microsoft 365
- Plugins y APIs
- Control de asientos/seats
- Gestión de renovaciones

### 🎫 Sistema de Tickets
- Gestión de solicitudes de clientes
- Tipos: bug, feature, support, change, consultation
- Prioridades y estados
- Asignación a usuarios
- Estimación de horas

### 💰 Gestión de Pagos
- Registro de mensualidades y anualidades
- Historial de pagos
- Pagos pendientes y vencidos
- Métodos de pago

### 🔔 Sistema de Recordatorios
- Recordatorios automáticos configurables
- Múltiples canales: Email, WhatsApp
- Días de recordatorio personalizables
- Notificaciones por tipo de evento

### 📊 Dashboard Analítico
- Métricas en tiempo real
- Clientes y servicios activos
- Ingresos mensuales y anuales
- Próximos vencimientos
- Alertas importantes
- Gráficos de ingresos

## 🏗️ Arquitectura del Sistema

### Arquitectura Clean Architecture

```
nelsystems-dashboard/
├── index.html                 # Punto de entrada HTML
├── manifest.json             # PWA Manifest
├── service-worker.js         # Service Worker para PWA
├── assets/                   # Recursos estáticos
│   └── images/
│       └── logo-512.png     # Logo de la aplicación
├── styles/                   # Estilos CSS
│   └── main.css            # Sistema de diseño completo
└── scripts/                 # JavaScript modular
    ├── app.js              # Aplicación principal y router
    ├── auth/               # Módulo de autenticación
    │   └── auth.js        # Gestión de login/sesiones
    ├── database/           # Capa de persistencia
    │   ├── schema.js      # Esquema de base de datos
    │   └── db.js          # Manejador de localStorage
    ├── services/           # Servicios de negocio
    │   ├── clients.service.js      # Gestión de clientes
    │   └── dashboard.service.js    # Métricas y estadísticas
    ├── components/         # Componentes UI reutilizables
    └── utils/              # Utilidades y helpers
        └── helpers.js     # Funciones de utilidad
```

### Principios de Diseño

#### SOLID
- **S**ingle Responsibility: Cada módulo tiene una responsabilidad única
- **O**pen/Closed: Extensible sin modificar código existente
- **L**iskov Substitution: Interfaces consistentes
- **I**nterface Segregation: Interfaces específicas
- **D**ependency Inversion: Dependencias hacia abstracciones

#### Clean Architecture
- **Separación de capas**: UI, Lógica de Negocio, Datos
- **Independencia de frameworks**: No acoplamiento a librerías específicas
- **Testable**: Diseño orientado a pruebas
- **Independiente de UI**: La lógica no depende de la interfaz

## 🗄️ Esquema de Base de Datos

### Tablas Principales

#### users
- Usuarios del sistema (administradores y operadores)
- Campos: email, passwordHash, name, role, avatar, isActive

#### clients
- Clientes de NelSystems
- Campos: name, company, email, phone, address, taxId, status

#### projects
- Proyectos de desarrollo
- Campos: clientId, name, description, status, priority, dates, budget

#### services
- Servicios SaaS
- Campos: clientId, type, billingCycle, amount, dates, status

#### domains
- Dominios registrados
- Campos: domain, registrar, expirationDate, dnsProvider, status

#### hosting
- Planes de hosting
- Campos: provider, plan, server, renewalDate, cost, status

#### licenses
- Licencias de software
- Campos: name, type, provider, seats, expirationDate, cost

#### tickets
- Solicitudes y tickets
- Campos: clientId, title, type, priority, status, assignedTo

#### payments
- Pagos y facturas
- Campos: clientId, invoiceNumber, amount, dueDate, status

#### notifications
- Notificaciones y recordatorios
- Campos: clientId, type, channel, scheduledFor, status

## 🎨 Sistema de Diseño

### Paleta de Colores
- **Brand Primary**: #FDB022 (Amarillo del logo)
- **Brand Dark**: #2C3E50 (Azul oscuro del logo)
- **Success**: #10b981
- **Warning**: #f59e0b
- **Error**: #ef4444
- **Info**: #3b82f6

### Tipografía
- **Display/Body**: Manrope (moderna, profesional)
- **Monospace**: JetBrains Mono (código y datos técnicos)

### Características UI/UX
- Modo claro y oscuro
- Diseño responsive (mobile-first)
- Animaciones suaves y profesionales
- Navegación intuitiva
- Cards informativas
- Gradientes modernos

## 📱 Progressive Web App (PWA)

### Características PWA
- ✅ Instalable en todos los dispositivos
- ✅ Funciona offline (cache inteligente)
- ✅ Service Worker registrado
- ✅ Web App Manifest
- ✅ Optimizada para móviles
- ✅ Splash screen
- ✅ App shortcuts

### Instalación
1. Abre la aplicación en tu navegador
2. El navegador mostrará un banner de instalación
3. Click en "Instalar" o "Agregar a pantalla de inicio"
4. La app se instalará como aplicación nativa

## 🚀 Cómo Usar

### Primer Inicio

1. **Abrir la aplicación**
   ```
   Abre index.html en un navegador moderno
   ```

2. **Credenciales por defecto**
   ```
   Email: admin@nelsystems.com
   Password: 123456789AiDyXm
   ```

3. **Explorar el dashboard**
   - Navega por las diferentes secciones usando el sidebar
   - Explora las métricas del dashboard
   - Revisa alertas y vencimientos

### Gestión de Datos

La aplicación usa **localStorage** como persistencia, simulando una base de datos real. Los datos se mantienen entre sesiones.

#### Limpiar Datos
```javascript
// Desde la consola del navegador
localStorage.clear();
location.reload();
```

#### Exportar Datos
```javascript
// Desde la consola del navegador
import('./scripts/database/db.js').then(m => {
  console.log(m.db.exportDatabase());
});
```

## 🔒 Seguridad

### Medidas Implementadas

1. **Autenticación**
   - Hash de contraseñas (producción: usar bcrypt)
   - Sesiones con expiración (24 horas)
   - Validación de credenciales

2. **Validación de Inputs**
   - Sanitización de entradas
   - Validación de formatos (email, teléfono, URL)
   - Prevención de campos vacíos

3. **Protección XSS**
   - Sanitización de HTML
   - Escapado de caracteres peligrosos
   - Content Security Policy (recomendado en producción)

4. **Control de Acceso**
   - Roles de usuario (admin/operator)
   - Verificación de permisos
   - Rutas protegidas

### Recomendaciones para Producción

1. **Backend Real**
   - Implementar API RESTful con Node.js/Express o similar
   - Base de datos: PostgreSQL, MongoDB
   - JWT para autenticación

2. **HTTPS**
   - SSL/TLS obligatorio
   - Certificados válidos

3. **Hashing Fuerte**
   - bcrypt o Argon2 para contraseñas
   - Salt único por usuario

4. **Rate Limiting**
   - Límite de intentos de login
   - Throttling de requests

5. **CORS**
   - Configuración apropiada
   - Whitelist de dominios

## 🛠️ Tecnologías Utilizadas

### Frontend
- HTML5
- CSS3 (Custom Properties, Grid, Flexbox)
- JavaScript ES6+ (Modules, Classes, Async/Await)

### PWA
- Service Worker
- Web App Manifest
- Cache API
- LocalStorage

### Patrones y Arquitectura
- Clean Architecture
- Repository Pattern
- Singleton Pattern
- Module Pattern
- MVC (Model-View-Controller)

### Herramientas de Diseño
- Google Fonts (Manrope, JetBrains Mono)
- SVG Icons
- CSS Custom Properties
- CSS Animations

## 📈 Roadmap y Mejoras Futuras

### Corto Plazo
- [ ] Implementar CRUD completo para todas las entidades
- [ ] Formularios modales para crear/editar
- [ ] Búsqueda y filtros avanzados
- [ ] Exportación de datos (CSV, PDF)
- [ ] Gráficos interactivos (Chart.js)

### Mediano Plazo
- [ ] Backend con Node.js + Express
- [ ] Base de datos PostgreSQL
- [ ] API RESTful
- [ ] Autenticación JWT
- [ ] Envío real de emails (Nodemailer)
- [ ] Integración WhatsApp API

### Largo Plazo
- [ ] Notificaciones push reales
- [ ] Sincronización en tiempo real
- [ ] App móvil nativa (React Native)
- [ ] Dashboard multi-tenant
- [ ] Integración con servicios externos (Stripe, QuickBooks)
- [ ] IA para predicciones y análisis

## 📝 Estructura de Datos de Ejemplo

### Cliente
```javascript
{
  id: "1234567890-abc",
  name: "Acme Corporation",
  company: "Acme Corp",
  email: "contact@acme.com",
  phone: "+1234567890",
  address: "123 Main St, City",
  taxId: "123-456-789",
  website: "https://acme.com",
  status: "active",
  createdAt: "2026-01-15T10:30:00Z",
  updatedAt: "2026-01-15T10:30:00Z"
}
```

### Servicio
```javascript
{
  id: "service-001",
  clientId: "1234567890-abc",
  name: "Hosting Premium",
  type: "hosting",
  billingCycle: "monthly",
  amount: 99.99,
  currency: "USD",
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  status: "active",
  autoRenew: true
}
```

## 🤝 Contribuir

### Guía de Estilo de Código

- **Indentación**: 2 espacios
- **Comillas**: Simples para JS, dobles para HTML
- **Semicolons**: Siempre usar
- **Naming**: camelCase para variables, PascalCase para clases
- **Comentarios**: JSDoc para funciones públicas

### Estructura de Commits
```
tipo(alcance): descripción corta

Descripción detallada del cambio

Refs: #issue
```

Tipos: feat, fix, docs, style, refactor, test, chore

## 📄 Licencia

© 2026 NelSystems. Todos los derechos reservados.

## 👥 Soporte

Para soporte técnico o consultas:
- Email: admin@nelsystems.com
- Dashboard: https://dashboard.nelsystems.com

---

**Desarrollado con ❤️ siguiendo Clean Architecture y SOLID principles**

*NelSystems Dashboard v1.0.0*
