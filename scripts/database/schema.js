/**
 * NELSYSTEMS DASHBOARD - DATABASE SCHEMA
 * 
 * Esquema completo de la base de datos del sistema
 * Siguiendo principios de normalización y Clean Architecture
 */

export const DB_SCHEMA = {
  version: '1.0.0',
  
  tables: {
    // ==================== AUTENTICACIÓN ====================
    users: {
      tableName: 'users',
      fields: {
        id: { type: 'string', primaryKey: true, required: true },
        email: { type: 'string', unique: true, required: true },
        passwordHash: { type: 'string', required: true },
        name: { type: 'string', required: true },
        role: { type: 'string', enum: ['admin', 'operator'], default: 'operator' },
        avatar: { type: 'string', nullable: true },
        isActive: { type: 'boolean', default: true },
        createdAt: { type: 'datetime', required: true },
        updatedAt: { type: 'datetime', required: true },
        lastLogin: { type: 'datetime', nullable: true }
      },
      indexes: ['email', 'role']
    },

    // ==================== CLIENTES ====================
    clients: {
      tableName: 'clients',
      fields: {
        id: { type: 'string', primaryKey: true, required: true },
        name: { type: 'string', required: true },
        company: { type: 'string', nullable: true },
        email: { type: 'string', required: true },
        phone: { type: 'string', nullable: true },
        address: { type: 'string', nullable: true },
        taxId: { type: 'string', nullable: true },
        website: { type: 'string', nullable: true },
        notes: { type: 'text', nullable: true },
        status: { type: 'string', enum: ['active', 'inactive', 'suspended'], default: 'active' },
        createdAt: { type: 'datetime', required: true },
        updatedAt: { type: 'datetime', required: true }
      },
      indexes: ['name', 'email', 'status']
    },

    // ==================== PROYECTOS ====================
    projects: {
      tableName: 'projects',
      fields: {
        id: { type: 'string', primaryKey: true, required: true },
        clientId: { type: 'string', foreignKey: 'clients.id', required: true },
        name: { type: 'string', required: true },
        description: { type: 'text', nullable: true },
        status: { type: 'string', enum: ['planning', 'in_progress', 'testing', 'deployed', 'maintenance', 'cancelled'], default: 'planning' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
        startDate: { type: 'date', nullable: true },
        endDate: { type: 'date', nullable: true },
        deliveryDate: { type: 'date', nullable: true },
        budget: { type: 'number', nullable: true },
        responsible: { type: 'string', nullable: true },
        repository: { type: 'string', nullable: true },
        productionUrl: { type: 'string', nullable: true },
        stagingUrl: { type: 'string', nullable: true },
        notes: { type: 'text', nullable: true },
        createdAt: { type: 'datetime', required: true },
        updatedAt: { type: 'datetime', required: true }
      },
      indexes: ['clientId', 'status', 'priority']
    },

    // ==================== SERVICIOS SAAS ====================
    services: {
      tableName: 'services',
      fields: {
        id: { type: 'string', primaryKey: true, required: true },
        clientId: { type: 'string', foreignKey: 'clients.id', required: true },
        projectId: { type: 'string', foreignKey: 'projects.id', nullable: true },
        name: { type: 'string', required: true },
        type: { type: 'string', enum: ['hosting', 'domain', 'development', 'maintenance', 'license', 'saas', 'other'], required: true },
        description: { type: 'text', nullable: true },
        provider: { type: 'string', nullable: true },
        startDate: { type: 'date', required: true },
        endDate: { type: 'date', nullable: true },
        billingCycle: { type: 'string', enum: ['monthly', 'quarterly', 'biannual', 'annual', 'one_time'], required: true },
        amount: { type: 'number', required: true },
        currency: { type: 'string', default: 'USD' },
        status: { type: 'string', enum: ['active', 'expired', 'cancelled', 'pending'], default: 'active' },
        autoRenew: { type: 'boolean', default: true },
        notes: { type: 'text', nullable: true },
        createdAt: { type: 'datetime', required: true },
        updatedAt: { type: 'datetime', required: true }
      },
      indexes: ['clientId', 'type', 'status', 'endDate']
    },

    // ==================== DOMINIOS ====================
    domains: {
      tableName: 'domains',
      fields: {
        id: { type: 'string', primaryKey: true, required: true },
        clientId: { type: 'string', foreignKey: 'clients.id', required: true },
        serviceId: { type: 'string', foreignKey: 'services.id', nullable: true },
        domain: { type: 'string', required: true, unique: true },
        registrar: { type: 'string', required: true },
        registrationDate: { type: 'date', required: true },
        expirationDate: { type: 'date', required: true },
        autoRenew: { type: 'boolean', default: true },
        dnsProvider: { type: 'string', nullable: true },
        nameservers: { type: 'json', nullable: true },
        status: { type: 'string', enum: ['active', 'expired', 'pending_transfer', 'locked'], default: 'active' },
        price: { type: 'number', nullable: true },
        reminderDays: { type: 'number', default: 30 },
        notes: { type: 'text', nullable: true },
        createdAt: { type: 'datetime', required: true },
        updatedAt: { type: 'datetime', required: true }
      },
      indexes: ['clientId', 'domain', 'expirationDate', 'status']
    },

    // ==================== HOSTING ====================
    hosting: {
      tableName: 'hosting',
      fields: {
        id: { type: 'string', primaryKey: true, required: true },
        clientId: { type: 'string', foreignKey: 'clients.id', required: true },
        serviceId: { type: 'string', foreignKey: 'services.id', nullable: true },
        provider: { type: 'string', required: true },
        plan: { type: 'string', required: true },
        server: { type: 'string', nullable: true },
        ipAddress: { type: 'string', nullable: true },
        storage: { type: 'string', nullable: true },
        bandwidth: { type: 'string', nullable: true },
        startDate: { type: 'date', required: true },
        renewalDate: { type: 'date', required: true },
        cost: { type: 'number', required: true },
        billingCycle: { type: 'string', enum: ['monthly', 'annual'], required: true },
        status: { type: 'string', enum: ['active', 'suspended', 'cancelled'], default: 'active' },
        cpanelUrl: { type: 'string', nullable: true },
        ftpHost: { type: 'string', nullable: true },
        notes: { type: 'text', nullable: true },
        createdAt: { type: 'datetime', required: true },
        updatedAt: { type: 'datetime', required: true }
      },
      indexes: ['clientId', 'provider', 'renewalDate', 'status']
    },

    // ==================== LICENCIAS ====================
    licenses: {
      tableName: 'licenses',
      fields: {
        id: { type: 'string', primaryKey: true, required: true },
        clientId: { type: 'string', foreignKey: 'clients.id', required: true },
        serviceId: { type: 'string', foreignKey: 'services.id', nullable: true },
        name: { type: 'string', required: true },
        type: { type: 'string', enum: ['google_workspace', 'microsoft_365', 'plugin', 'api', 'software', 'other'], required: true },
        provider: { type: 'string', required: true },
        licenseKey: { type: 'string', nullable: true },
        seats: { type: 'number', default: 1 },
        purchaseDate: { type: 'date', required: true },
        expirationDate: { type: 'date', nullable: true },
        renewalDate: { type: 'date', nullable: true },
        cost: { type: 'number', required: true },
        billingCycle: { type: 'string', enum: ['monthly', 'annual', 'perpetual'], required: true },
        status: { type: 'string', enum: ['active', 'expired', 'cancelled'], default: 'active' },
        autoRenew: { type: 'boolean', default: true },
        notes: { type: 'text', nullable: true },
        createdAt: { type: 'datetime', required: true },
        updatedAt: { type: 'datetime', required: true }
      },
      indexes: ['clientId', 'type', 'expirationDate', 'status']
    },

    // ==================== TICKETS / SOLICITUDES ====================
    tickets: {
      tableName: 'tickets',
      fields: {
        id: { type: 'string', primaryKey: true, required: true },
        clientId: { type: 'string', foreignKey: 'clients.id', required: true },
        projectId: { type: 'string', foreignKey: 'projects.id', nullable: true },
        serviceId: { type: 'string', foreignKey: 'services.id', nullable: true },
        title: { type: 'string', required: true },
        description: { type: 'text', required: true },
        type: { type: 'string', enum: ['bug', 'feature', 'support', 'change', 'consultation'], required: true },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
        status: { type: 'string', enum: ['open', 'in_progress', 'pending_client', 'resolved', 'closed'], default: 'open' },
        assignedTo: { type: 'string', foreignKey: 'users.id', nullable: true },
        estimatedHours: { type: 'number', nullable: true },
        actualHours: { type: 'number', nullable: true },
        dueDate: { type: 'date', nullable: true },
        resolvedAt: { type: 'datetime', nullable: true },
        closedAt: { type: 'datetime', nullable: true },
        tags: { type: 'json', nullable: true },
        attachments: { type: 'json', nullable: true },
        createdAt: { type: 'datetime', required: true },
        updatedAt: { type: 'datetime', required: true }
      },
      indexes: ['clientId', 'status', 'priority', 'type', 'assignedTo']
    },

    // ==================== PAGOS ====================
    payments: {
      tableName: 'payments',
      fields: {
        id: { type: 'string', primaryKey: true, required: true },
        clientId: { type: 'string', foreignKey: 'clients.id', required: true },
        serviceId: { type: 'string', foreignKey: 'services.id', nullable: true },
        invoiceNumber: { type: 'string', unique: true, required: true },
        description: { type: 'text', required: true },
        amount: { type: 'number', required: true },
        currency: { type: 'string', default: 'USD' },
        dueDate: { type: 'date', required: true },
        paidDate: { type: 'date', nullable: true },
        status: { type: 'string', enum: ['pending', 'paid', 'overdue', 'cancelled'], default: 'pending' },
        paymentMethod: { type: 'string', enum: ['cash', 'transfer', 'card', 'paypal', 'other'], nullable: true },
        transactionId: { type: 'string', nullable: true },
        notes: { type: 'text', nullable: true },
        createdAt: { type: 'datetime', required: true },
        updatedAt: { type: 'datetime', required: true }
      },
      indexes: ['clientId', 'status', 'dueDate', 'invoiceNumber']
    },

    // ==================== NOTIFICACIONES / RECORDATORIOS ====================
    notifications: {
      tableName: 'notifications',
      fields: {
        id: { type: 'string', primaryKey: true, required: true },
        clientId: { type: 'string', foreignKey: 'clients.id', required: true },
        relatedType: { type: 'string', enum: ['service', 'payment', 'domain', 'hosting', 'license'], required: true },
        relatedId: { type: 'string', required: true },
        type: { type: 'string', enum: ['expiration', 'renewal', 'payment_due', 'payment_overdue'], required: true },
        title: { type: 'string', required: true },
        message: { type: 'text', required: true },
        channel: { type: 'string', enum: ['email', 'whatsapp', 'sms', 'push'], required: true },
        scheduledFor: { type: 'datetime', required: true },
        sentAt: { type: 'datetime', nullable: true },
        status: { type: 'string', enum: ['pending', 'sent', 'failed', 'cancelled'], default: 'pending' },
        error: { type: 'text', nullable: true },
        createdAt: { type: 'datetime', required: true },
        updatedAt: { type: 'datetime', required: true }
      },
      indexes: ['clientId', 'status', 'scheduledFor', 'type']
    },

    // ==================== CONFIGURACIÓN ====================
    settings: {
      tableName: 'settings',
      fields: {
        id: { type: 'string', primaryKey: true, required: true },
        key: { type: 'string', unique: true, required: true },
        value: { type: 'json', required: true },
        category: { type: 'string', required: true },
        description: { type: 'text', nullable: true },
        updatedAt: { type: 'datetime', required: true }
      },
      indexes: ['key', 'category']
    }
  }
};

// Configuraciones por defecto del sistema
export const DEFAULT_SETTINGS = {
  notifications: {
    key: 'notifications',
    value: {
      email: {
        enabled: true,
        daysBefore: [30, 15, 7, 3, 1]
      },
      whatsapp: {
        enabled: false,
        daysBefore: [7, 3, 1]
      }
    },
    category: 'notifications',
    description: 'Configuración de notificaciones automáticas'
  },
  currency: {
    key: 'currency',
    value: {
      default: 'USD',
      symbol: '$',
      decimals: 2
    },
    category: 'general',
    description: 'Configuración de moneda'
  },
  company: {
    key: 'company',
    value: {
      name: 'NelSystems',
      email: 'admin@nelsystems.com',
      phone: '',
      website: 'https://nelsystems.com',
      address: ''
    },
    category: 'general',
    description: 'Información de la empresa'
  }
};
