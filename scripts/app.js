/**
 * NELSYSTEMS DASHBOARD - MAIN APPLICATION
 * 
 * Punto de entrada principal de la aplicación
 * Maneja inicialización, routing y coordinación de componentes
 */

import auth from './auth/auth.js';
import db from './database/db.js';
import dashboardService from './services/dashboard.service.js';
import clientsService from './services/clients.service.js';
import { formatCurrency, formatDate, getStatusColor, getInitials, showToast, getStatusBgColor, truncate, daysUntil } from './utils/helpers.js';
import modal from './components/Modal.js';
import projectsService from './services/projects.service.js';
import servicesService from './services/services.service.js';
import domainsService from './services/domains.service.js';
import hostingService from './services/hosting.service.js';
import licensesService from './services/licenses.service.js';
import ticketsService from './services/tickets.service.js';
import paymentsService from './services/payments.service.js';

class App {
  constructor() {
    this.currentRoute = null;
    this.theme = localStorage.getItem('theme') || 'light';
    this.sidebarOpen = true;
    
    this.init();
  }

  /**
   * Inicializa la aplicación
   */
  async init() {
    console.log('NelSystems Dashboard v1.0.0 - Inicializando...');
    
    // Registrar Service Worker
    this.registerServiceWorker();
    
    // Aplicar tema
    this.applyTheme(this.theme);
    
    // Esperar un momento para mostrar splash screen
    await this.sleep(1500);
    
    // Ocultar splash screen
    this.hideSplashScreen();
    
    // Verificar autenticación
    if (auth.isAuthenticated()) {
      this.showDashboard();
    } else {
      this.showLogin();
    }
    
    // Inicializar event listeners
    this.initEventListeners();
    
    // Inicializar router
    this.initRouter();
  }

  /**
   * Registra el Service Worker para PWA
   */
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('./service-worker.js');
        console.log('Service Worker registrado:', registration.scope);
      } catch (error) {
        console.error('Error registrando Service Worker:', error);
      }
    }
  }

  /**
   * Oculta el splash screen
   */
  hideSplashScreen() {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      setTimeout(() => {
        splash.style.display = 'none';
      }, 300);
    }
  }

  /**
   * Muestra la vista de login
   */
  showLogin() {
    document.getElementById('login-view').classList.remove('hidden');
    document.getElementById('dashboard-view').classList.add('hidden');
  }

  /**
   * Muestra el dashboard
   */
  showDashboard() {
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');
    
    // Actualizar información del usuario
    this.updateUserInfo();
    
    // Navegar a la ruta actual o dashboard por defecto
    const hash = window.location.hash || '#/dashboard';
    this.navigate(hash.substring(2));
  }

  /**
   * Actualiza información del usuario en la UI
   */
  updateUserInfo() {
    const user = auth.getCurrentUser();
    if (user) {
      const userNameEl = document.getElementById('user-name');
      const userEmailEl = document.getElementById('user-email');
      const userAvatarEl = document.getElementById('user-avatar');
      
      if (userNameEl) userNameEl.textContent = user.name;
      if (userEmailEl) userEmailEl.textContent = user.email;
      if (userAvatarEl) userAvatarEl.textContent = getInitials(user.name);
    }
  }

  /**
   * Inicializa event listeners
   */
  initEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }
    
    // Sidebar toggle (mobile)
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => this.toggleSidebar());
    }
    
    // Navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const route = item.getAttribute('data-route');
        this.navigate(route);
      });
    });
  }

  /**
   * Maneja el login
   */
  async handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    const result = await auth.login(email, password);
    
    if (result.success) {
      showToast('¡Bienvenido!', 'success');
      this.showDashboard();
    } else {
      showToast(result.error, 'error');
    }
  }

  /**
   * Maneja el logout
   */
  handleLogout() {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
      auth.logout();
      this.showLogin();
      showToast('Sesión cerrada', 'info');
    }
  }

  /**
   * Toggle tema
   */
  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.theme);
    localStorage.setItem('theme', this.theme);
  }

  /**
   * Aplica un tema
   */
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  /**
   * Toggle sidebar (mobile)
   */
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    this.sidebarOpen = !this.sidebarOpen;
    sidebar.classList.toggle('open', this.sidebarOpen);
  }

  /**
   * Inicializa el router
   */
  initRouter() {
    window.addEventListener('hashchange', () => {
      const route = window.location.hash.substring(2) || 'dashboard';
      this.navigate(route);
    });
  }

  /**
   * Navega a una ruta
   */
  navigate(route) {
    if (!auth.isAuthenticated()) {
      this.showLogin();
      return;
    }
    
    this.currentRoute = route;
    window.location.hash = `#/${route}`;
    
    // Actualizar navegación activa
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-route') === route) {
        item.classList.add('active');
      }
    });

    
    // Cerrar sidebar en mobile
    if (window.innerWidth < 768) {
      const sidebar = document.getElementById('sidebar');
      sidebar.classList.remove('open');
      this.sidebarOpen = false;
    }
    
    // Cargar vista
    this.loadView(route);
  }

  /**
   * Carga una vista
   */
  loadView(route) {
    const content = document.getElementById('page-content');
    
    switch (route) {
      case 'dashboard':
        this.renderDashboard(content);
        this.updatePageTitle('Dashboard', 'Resumen general del sistema');
        break;
      
      case 'clients':
        this.renderClients(content);
        this.updatePageTitle('Clientes', 'Gestión de clientes');
        break;
      
      case 'projects':
        this.renderProjects(content);
        this.updatePageTitle('Proyectos', 'Gestión de proyectos');
        break;
      
      case 'services':
        this.renderServices(content);
        this.updatePageTitle('Servicios', 'Gestión de servicios SaaS');
        break;
      
      case 'domains':
        this.renderDomains(content);
        this.updatePageTitle('Dominios', 'Control de dominios');
        break;
      
      case 'hosting':
        this.renderHosting(content);
        this.updatePageTitle('Hosting', 'Control de hosting');
        break;
      
      case 'licenses':
        this.renderLicenses(content);
        this.updatePageTitle('Licencias', 'Control de licencias');
        break;
      
      case 'tickets':
        this.renderTickets(content);
        this.updatePageTitle('Tickets', 'Gestión de solicitudes');
        break;
      
      case 'payments':
        this.renderPayments(content);
        this.updatePageTitle('Pagos', 'Gestión de pagos');
        break;
      
      default:
        this.render404(content);
        this.updatePageTitle('404', 'Página no encontrada');
    }
  }

  /**
   * Actualiza el título de la página
   */
  updatePageTitle(title, subtitle) {
    document.getElementById('page-title').textContent = title;
    document.getElementById('page-subtitle').textContent = subtitle;
    document.title = `${title} - NelSystems Dashboard`;
  }


/**
 * Abre formulario para crear/editar cliente
 */
openClientForm(clientId = null) {
  const client = clientId ? clientsService.getById(clientId) : {};
  
  modal.createForm({
    title: clientId ? 'Editar Cliente' : 'Nuevo Cliente',
    fields: [
      { name: 'name', label: 'Nombre', type: 'text', required: true },
      { name: 'company', label: 'Empresa', type: 'text' },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Teléfono', type: 'tel' },
      { name: 'address', label: 'Dirección', type: 'text' },
      { name: 'taxId', label: 'RFC/Tax ID', type: 'text' },
      { name: 'website', label: 'Sitio Web', type: 'url' },
      { 
        name: 'status', 
        label: 'Estado', 
        type: 'select',
        options: [
          { value: 'active', label: 'Activo' },
          { value: 'inactive', label: 'Inactivo' },
          { value: 'suspended', label: 'Suspendido' }
        ],
        required: true
      },
      { name: 'notes', label: 'Notas', type: 'textarea', rows: 4 }
    ],
    data: client,
    onSubmit: (values) => {
      if (clientId) {
        const success = clientsService.update(clientId, values);
        if (success) {
          this.navigate('clients'); // Recargar vista
        }
        return success;
      } else {
        const newClient = clientsService.create(values);
        if (newClient) {
          this.navigate('clients'); // Recargar vista
        }
        return newClient !== null;
      }
    }
  });
}

/**
 * Abre formulario para crear/editar proyecto
 */
openProjectForm(projectId = null) {
  const project = projectId ? projectsService.getById(projectId) : {};
  const clients = clientsService.getAll({ status: 'active' });
  
  modal.createForm({
    title: projectId ? 'Editar Proyecto' : 'Nuevo Proyecto',
    fields: [
      { 
        name: 'clientId', 
        label: 'Cliente', 
        type: 'select',
        options: clients.map(c => ({ value: c.id, label: c.name })),
        required: true
      },
      { name: 'name', label: 'Nombre del Proyecto', type: 'text', required: true },
      { name: 'description', label: 'Descripción', type: 'textarea', rows: 3 },
      { 
        name: 'status', 
        label: 'Estado', 
        type: 'select',
        options: [
          { value: 'planning', label: 'Planificación' },
          { value: 'in_progress', label: 'En Progreso' },
          { value: 'testing', label: 'Testing' },
          { value: 'deployed', label: 'Desplegado' },
          { value: 'maintenance', label: 'Mantenimiento' },
          { value: 'cancelled', label: 'Cancelado' }
        ],
        required: true
      },
      { 
        name: 'priority', 
        label: 'Prioridad', 
        type: 'select',
        options: [
          { value: 'low', label: 'Baja' },
          { value: 'medium', label: 'Media' },
          { value: 'high', label: 'Alta' },
          { value: 'critical', label: 'Crítica' }
        ],
        required: true
      },
      { name: 'startDate', label: 'Fecha de Inicio', type: 'date' },
      { name: 'endDate', label: 'Fecha de Fin', type: 'date' },
      { name: 'deliveryDate', label: 'Fecha de Entrega', type: 'date' },
      { name: 'budget', label: 'Presupuesto', type: 'number', placeholder: '0.00' },
      { name: 'responsible', label: 'Responsable', type: 'text' },
      { name: 'repository', label: 'Repositorio (URL)', type: 'url', placeholder: 'https://github.com/...' },
      { name: 'productionUrl', label: 'URL Producción', type: 'url', placeholder: 'https://...' },
      { name: 'stagingUrl', label: 'URL Staging', type: 'url', placeholder: 'https://staging...' },
      { name: 'notes', label: 'Notas', type: 'textarea', rows: 3 }
    ],
    data: project,
    onSubmit: (values) => {
      if (projectId) {
        const success = projectsService.update(projectId, values);
        if (success) {
          this.navigate('projects');
        }
        return success;
      } else {
        const newProject = projectsService.create(values);
        if (newProject) {
          this.navigate('projects');
        }
        return newProject !== null;
      }
    }
  });
}
  
  /**
   * Renderiza el dashboard
   */
  renderDashboard(container) {
    const metrics = dashboardService.getMetrics();
    
    container.innerHTML = `
      <div class="grid grid-cols-4" style="margin-bottom: var(--space-lg);">
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-md);">
            <div>
              <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Clientes Activos</div>
              <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--color-text-primary);">${metrics.clients.active}</div>
            </div>
            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, var(--brand-primary) 0%, #f59e0b 100%); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
              <svg style="width: 24px; height: 24px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          </div>
          <div style="font-size: var(--font-size-sm); color: var(--color-success);">
            +${metrics.clients.newThisMonth} este mes
          </div>
        </div>
        
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-md);">
            <div>
              <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Servicios Activos</div>
              <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--color-text-primary);">${metrics.services.active}</div>
            </div>
            <div style="width: 48px; height: 48px; background: #3b82f6; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
              <svg style="width: 24px; height: 24px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
            </div>
          </div>
          <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">
            De ${metrics.services.total} totales
          </div>
        </div>
        
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-md);">
            <div>
              <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Ingresos Mensuales</div>
              <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--color-text-primary);">${formatCurrency(metrics.financial.monthlyRevenue)}</div>
            </div>
            <div style="width: 48px; height: 48px; background: #10b981; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
              <svg style="width: 24px; height: 24px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
          </div>
          <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">
            ~${formatCurrency(metrics.financial.annualRevenue)}/año
          </div>
        </div>
        
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-md);">
            <div>
              <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Pagos Pendientes</div>
              <div style="font-size: var(--font-size-3xl); font-weight: 700; color: var(--color-text-primary);">${metrics.financial.pendingPayments}</div>
            </div>
            <div style="width: 48px; height: 48px; background: #f59e0b; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
              <svg style="width: 24px; height: 24px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            </div>
          </div>
          <div style="font-size: var(--font-size-sm); color: var(--color-warning);">
            ${formatCurrency(metrics.financial.totalPending)}
          </div>
        </div>
      </div>
      
      ${metrics.alerts.length > 0 ? `
        <div style="margin-bottom: var(--space-lg);">
          <h2 style="font-size: var(--font-size-lg); font-weight: 700; margin-bottom: var(--space-md);">Alertas Importantes</h2>
          <div class="grid grid-cols-2">
            ${metrics.alerts.map(alert => `
              <div class="card" style="border-left: 4px solid ${alert.type === 'error' ? 'var(--color-error)' : 'var(--color-warning)'};">
                <h3 style="font-size: var(--font-size-base); font-weight: 600; margin-bottom: var(--space-xs);">${alert.title}</h3>
                <p style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">${alert.message}</p>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <div>
        <h2 style="font-size: var(--font-size-lg); font-weight: 700; margin-bottom: var(--space-md);">Próximos Vencimientos</h2>
        ${metrics.upcoming.length > 0 ? `
          <div class="card">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1px solid var(--color-border-primary);">
                  <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Tipo</th>
                  <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Nombre</th>
                  <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Cliente</th>
                  <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Fecha</th>
                  <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Días</th>
                  <th style="text-align: right; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Monto</th>
                </tr>
              </thead>
              <tbody>
                ${metrics.upcoming.slice(0, 10).map(item => `
                  <tr style="border-bottom: 1px solid var(--color-border-secondary);">
                    <td style="padding: var(--space-sm); font-size: var(--font-size-sm);">
                      <span style="padding: 4px 8px; background: var(--color-bg-secondary); border-radius: var(--radius-sm); font-size: var(--font-size-xs); text-transform: uppercase;">${item.type}</span>
                    </td>
                    <td style="padding: var(--space-sm); font-size: var(--font-size-sm); font-weight: 500;">${item.name}</td>
                    <td style="padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary);">${item.client}</td>
                    <td style="padding: var(--space-sm); font-size: var(--font-size-sm);">${formatDate(item.date)}</td>
                    <td style="padding: var(--space-sm); font-size: var(--font-size-sm);">
                      <span style="color: ${getStatusColor(item.priority)}; font-weight: 600;">${item.daysLeft} días</span>
                    </td>
                    <td style="padding: var(--space-sm); font-size: var(--font-size-sm); text-align: right; font-weight: 600;">${formatCurrency(item.amount)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="card" style="text-align: center; padding: var(--space-2xl);">
            <p style="color: var(--color-text-secondary);">No hay vencimientos próximos</p>
          </div>
        `}
      </div>
    `;
  }

  /**
   * Renderiza la vista de clientes
   */
  renderClients(container) {
    const clients = clientsService.getAll();
    
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
        <div>
          <h2 style="font-size: var(--font-size-xl); font-weight: 700; margin-bottom: 4px;">Clientes</h2>
          <p style="color: var(--color-text-secondary);">${clients.length} cliente${clients.length !== 1 ? 's' : ''} registrado${clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button class="btn btn-primary" onclick="app.openClientForm()">
          <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nuevo Cliente
        </button>
      </div>
      
      ${clients.length > 0 ? `
        <div class="card">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid var(--color-border-primary);">
                <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Nombre</th>
                <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Email</th>
                <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Empresa</th>
                <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Estado</th>
                <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Fecha Registro</th>
              </tr>
            </thead>
            <tbody>
              ${clients.map(client => `
                <tr style="border-bottom: 1px solid var(--color-border-secondary);">
                  <td style="padding: var(--space-sm); font-size: var(--font-size-sm); font-weight: 600;">${client.name}</td>
                  <td style="padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary);">${client.email}</td>
                  <td style="padding: var(--space-sm); font-size: var(--font-size-sm);">${client.company || '-'}</td>
                  <td style="padding: var(--space-sm); font-size: var(--font-size-sm);">
                    <span style="padding: 4px 8px; background: ${client.status === 'active' ? 'var(--color-success-bg)' : 'var(--color-error-bg)'}; color: ${getStatusColor(client.status)}; border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-weight: 600; text-transform: capitalize;">${client.status}</span>
                  </td>
                  <td style="padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary);">${formatDate(client.createdAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : `
        <div class="card" style="text-align: center; padding: var(--space-2xl);">
          <p style="color: var(--color-text-secondary); margin-bottom: var(--space-md);">No hay clientes registrados</p>
          <button class="btn btn-primary" onclick="window.app.openClientForm()">Crear Primer Cliente</button>
        </div>
      `}
    `;
  }

  /**
   * Renderiza placeholder para otras vistas
   */
renderProjects(container) {
  const projects = projectsService.getAll();
  const clients = clientsService.getAll();
  const stats = projectsService.getStats();
  
  container.innerHTML = `
    <div style="margin-bottom: var(--space-lg);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
        <div>
          <h2 style="font-size: var(--font-size-xl); font-weight: 700; margin-bottom: 4px;">Proyectos</h2>
          <p style="color: var(--color-text-secondary);">${projects.length} proyecto${projects.length !== 1 ? 's' : ''} registrado${projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button class="btn btn-primary" onclick="window.app.openProjectForm()">
          <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nuevo Proyecto
        </button>
      </div>
      
      <div class="grid grid-cols-4" style="margin-bottom: var(--space-lg);">
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">En Progreso</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-warning);">${stats.inProgress}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Desplegados</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-success);">${stats.deployed}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">En Testing</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-info);">${stats.testing}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Alta Prioridad</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-error);">${stats.highPriority}</div>
        </div>
      </div>
    </div>
    
    ${projects.length > 0 ? `
      <div class="card">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--color-border-primary);">
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Proyecto</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Cliente</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Estado</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Prioridad</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Fecha Entrega</th>
              <th style="text-align: right; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${projects.map(project => {
              const client = clients.find(c => c.id === project.clientId);
              const statusLabels = {
                planning: 'Planificación',
                in_progress: 'En Progreso',
                testing: 'Testing',
                deployed: 'Desplegado',
                maintenance: 'Mantenimiento',
                cancelled: 'Cancelado'
              };
              const priorityLabels = {
                low: 'Baja',
                medium: 'Media',
                high: 'Alta',
                critical: 'Crítica'
              };
              
              return `
                <tr style="border-bottom: 1px solid var(--color-border-secondary);">
                  <td style="padding: var(--space-sm);">
                    <div style="font-weight: 600; margin-bottom: 2px;">${project.name}</div>
                    ${project.description ? `<div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">${truncate(project.description, 50)}</div>` : ''}
                  </td>
                  <td style="padding: var(--space-sm); color: var(--color-text-secondary);">${client?.name || 'Sin cliente'}</td>
                  <td style="padding: var(--space-sm);">
                    <span style="padding: 4px 8px; background: ${getStatusBgColor(project.status)}; color: ${getStatusColor(project.status)}; border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-weight: 600;">
                      ${statusLabels[project.status]}
                    </span>
                  </td>
                  <td style="padding: var(--space-sm);">
                    <span style="padding: 4px 8px; background: ${getStatusBgColor(project.priority)}; color: ${getStatusColor(project.priority)}; border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-weight: 600;">
                      ${priorityLabels[project.priority]}
                    </span>
                  </td>
                  <td style="padding: var(--space-sm); color: var(--color-text-secondary);">
                    ${project.deliveryDate ? formatDate(project.deliveryDate) : '-'}
                  </td>
                  <td style="padding: var(--space-sm); text-align: right;">
                    <button 
                      class="btn-icon" 
                      onclick="window.app.openProjectForm('${project.id}')"
                      title="Editar"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button 
                      class="btn-icon" 
                      onclick="if(confirm('¿Eliminar este proyecto?')) { projectsService.delete('${project.id}'); window.app.navigate('projects'); }"
                      title="Eliminar"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    ` : `
      <div class="card" style="text-align: center; padding: var(--space-2xl);">
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-md);">No hay proyectos registrados</p>
        <button class="btn btn-primary" onclick="window.app.openProjectForm()">Crear Primer Proyecto</button>
      </div>
    `}
  `;
}

renderServices(container) {
  const services = servicesService.getAll();
  const clients = clientsService.getAll();
  const stats = servicesService.getStats();
  
  container.innerHTML = `
    <div style="margin-bottom: var(--space-lg);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
        <div>
          <h2 style="font-size: var(--font-size-xl); font-weight: 700; margin-bottom: 4px;">Servicios</h2>
          <p style="color: var(--color-text-secondary);">${services.length} servicio${services.length !== 1 ? 's' : ''} registrado${services.length !== 1 ? 's' : ''}</p>
        </div>
        <button class="btn btn-primary" onclick="window.app.openServiceForm()">
          <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nuevo Servicio
        </button>
      </div>
      
      <div class="grid grid-cols-4" style="margin-bottom: var(--space-lg);">
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Activos</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-success);">${stats.active}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Vencidos</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-error);">${stats.expired}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Pendientes</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-warning);">${stats.pending}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Total</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-text-primary);">${stats.total}</div>
        </div>
      </div>
    </div>
    
    ${services.length > 0 ? `
      <div class="card">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--color-border-primary);">
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Servicio</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Cliente</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Tipo</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Ciclo</th>
              <th style="text-align: right; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Monto</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Estado</th>
              <th style="text-align: right; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${services.map(service => {
              const client = clients.find(c => c.id === service.clientId);
              return `
                <tr style="border-bottom: 1px solid var(--color-border-secondary);">
                  <td style="padding: var(--space-sm); font-weight: 600;">${service.name}</td>
                  <td style="padding: var(--space-sm); color: var(--color-text-secondary);">${client?.name || '-'}</td>
                  <td style="padding: var(--space-sm);">
                    <span style="padding: 4px 8px; background: var(--color-bg-secondary); border-radius: var(--radius-sm); font-size: var(--font-size-xs); text-transform: capitalize;">${service.type}</span>
                  </td>
                  <td style="padding: var(--space-sm); color: var(--color-text-secondary); text-transform: capitalize;">${service.billingCycle}</td>
                  <td style="padding: var(--space-sm); text-align: right; font-weight: 600;">${formatCurrency(service.amount)}</td>
                  <td style="padding: var(--space-sm);">
                    <span style="padding: 4px 8px; background: ${getStatusBgColor(service.status)}; color: ${getStatusColor(service.status)}; border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-weight: 600; text-transform: capitalize;">${service.status}</span>
                  </td>
                  <td style="padding: var(--space-sm); text-align: right;">
                    <button class="btn-icon" onclick="window.app.openServiceForm('${service.id}')" title="Editar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button class="btn-icon" onclick="if(confirm('¿Eliminar?')) { servicesService.delete('${service.id}'); window.app.navigate('services'); }" title="Eliminar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    ` : `
      <div class="card" style="text-align: center; padding: var(--space-2xl);">
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-md);">No hay servicios registrados</p>
        <button class="btn btn-primary" onclick="window.app.openServiceForm()">Crear Primer Servicio</button>
      </div>
    `}
  `;
}

// Formulario de Servicios - Agregar después de openProjectForm()
openServiceForm(serviceId = null) {
  const service = serviceId ? servicesService.getById(serviceId) : {};
  const clients = clientsService.getAll({ status: 'active' });
  
  modal.createForm({
    title: serviceId ? 'Editar Servicio' : 'Nuevo Servicio',
    fields: [
      { name: 'clientId', label: 'Cliente', type: 'select', options: clients.map(c => ({ value: c.id, label: c.name })), required: true },
      { name: 'name', label: 'Nombre del Servicio', type: 'text', required: true },
      { name: 'type', label: 'Tipo', type: 'select', options: [
        { value: 'hosting', label: 'Hosting' },
        { value: 'domain', label: 'Dominio' },
        { value: 'development', label: 'Desarrollo' },
        { value: 'maintenance', label: 'Mantenimiento' },
        { value: 'license', label: 'Licencia' },
        { value: 'saas', label: 'SaaS' },
        { value: 'other', label: 'Otro' }
      ], required: true },
      { name: 'description', label: 'Descripción', type: 'textarea', rows: 2 },
      { name: 'provider', label: 'Proveedor', type: 'text' },
      { name: 'billingCycle', label: 'Ciclo de Facturación', type: 'select', options: [
        { value: 'monthly', label: 'Mensual' },
        { value: 'quarterly', label: 'Trimestral' },
        { value: 'biannual', label: 'Semestral' },
        { value: 'annual', label: 'Anual' },
        { value: 'one_time', label: 'Pago Único' }
      ], required: true },
      { name: 'amount', label: 'Monto', type: 'number', required: true, placeholder: '0.00' },
      { name: 'currency', label: 'Moneda', type: 'select', options: [
        { value: 'USD', label: 'USD' },
        { value: 'EUR', label: 'EUR' },
        { value: 'MXN', label: 'MXN' }
      ] },
      { name: 'startDate', label: 'Fecha de Inicio', type: 'date', required: true },
      { name: 'endDate', label: 'Fecha de Vencimiento', type: 'date' },
      { name: 'status', label: 'Estado', type: 'select', options: [
        { value: 'active', label: 'Activo' },
        { value: 'expired', label: 'Vencido' },
        { value: 'cancelled', label: 'Cancelado' },
        { value: 'pending', label: 'Pendiente' }
      ], required: true },
      { name: 'autoRenew', label: 'Auto-renovar', type: 'checkbox' },
      { name: 'notes', label: 'Notas', type: 'textarea', rows: 2 }
    ],
    data: service,
    onSubmit: (values) => {
      if (serviceId) {
        const success = servicesService.update(serviceId, values);
        if (success) this.navigate('services');
        return success;
      } else {
        const newService = servicesService.create(values);
        if (newService) this.navigate('services');
        return newService !== null;
      }
    }
  });
}

renderDomains(container) {
  const domains = domainsService.getAll();
  const clients = clientsService.getAll();
  const stats = domainsService.getStats();
  
  container.innerHTML = `
    <div style="margin-bottom: var(--space-lg);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
        <div>
          <h2 style="font-size: var(--font-size-xl); font-weight: 700; margin-bottom: 4px;">Dominios</h2>
          <p style="color: var(--color-text-secondary);">${domains.length} dominio${domains.length !== 1 ? 's' : ''} registrado${domains.length !== 1 ? 's' : ''}</p>
        </div>
        <button class="btn btn-primary" onclick="window.app.openDomainForm()">
          <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nuevo Dominio
        </button>
      </div>
      
      <div class="grid grid-cols-4" style="margin-bottom: var(--space-lg);">
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Activos</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-success);">${stats.active}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Vencen Pronto</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-warning);">${stats.expiringSoon}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Críticos (7 días)</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-error);">${stats.critical}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Vencidos</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-text-tertiary);">${stats.expired}</div>
        </div>
      </div>
    </div>
    
    ${domains.length > 0 ? `
      <div class="card">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--color-border-primary);">
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Dominio</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Cliente</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Registrador</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Vence</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Días</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Estado</th>
              <th style="text-align: right; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${domains.map(domain => {
              const client = clients.find(c => c.id === domain.clientId);
              const daysLeft = daysUntil(domain.expirationDate);
              return `
                <tr style="border-bottom: 1px solid var(--color-border-secondary);">
                  <td style="padding: var(--space-sm); font-weight: 600;">${domain.domain}</td>
                  <td style="padding: var(--space-sm); color: var(--color-text-secondary);">${client?.name || '-'}</td>
                  <td style="padding: var(--space-sm); color: var(--color-text-secondary);">${domain.registrar}</td>
                  <td style="padding: var(--space-sm); color: var(--color-text-secondary);">${formatDate(domain.expirationDate)}</td>
                  <td style="padding: var(--space-sm);">
                    <span style="color: ${daysLeft <= 7 ? 'var(--color-error)' : daysLeft <= 30 ? 'var(--color-warning)' : 'var(--color-success)'}; font-weight: 600;">
                      ${daysLeft} días
                    </span>
                  </td>
                  <td style="padding: var(--space-sm);">
                    <span style="padding: 4px 8px; background: ${getStatusBgColor(domain.status)}; color: ${getStatusColor(domain.status)}; border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-weight: 600; text-transform: capitalize;">${domain.status}</span>
                  </td>
                  <td style="padding: var(--space-sm); text-align: right;">
                    <button class="btn-icon" onclick="window.app.openDomainForm('${domain.id}')" title="Editar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button class="btn-icon" onclick="if(confirm('¿Eliminar?')) { domainsService.delete('${domain.id}'); window.app.navigate('domains'); }" title="Eliminar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    ` : `
      <div class="card" style="text-align: center; padding: var(--space-2xl);">
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-md);">No hay dominios registrados</p>
        <button class="btn btn-primary" onclick="window.app.openDomainForm()">Registrar Primer Dominio</button>
      </div>
    `}
  `;
}

openDomainForm(domainId = null) {
  const domain = domainId ? domainsService.getById(domainId) : {};
  const clients = clientsService.getAll({ status: 'active' });
  
  modal.createForm({
    title: domainId ? 'Editar Dominio' : 'Nuevo Dominio',
    fields: [
      { name: 'clientId', label: 'Cliente', type: 'select', options: clients.map(c => ({ value: c.id, label: c.name })), required: true },
      { name: 'domain', label: 'Dominio', type: 'text', required: true, placeholder: 'ejemplo.com' },
      { name: 'registrar', label: 'Registrador', type: 'text', required: true, placeholder: 'GoDaddy, Namecheap, etc.' },
      { name: 'registrationDate', label: 'Fecha de Registro', type: 'date', required: true },
      { name: 'expirationDate', label: 'Fecha de Expiración', type: 'date', required: true },
      { name: 'price', label: 'Precio Anual', type: 'number', placeholder: '0.00' },
      { name: 'dnsProvider', label: 'Proveedor DNS', type: 'text', placeholder: 'Cloudflare, Route53, etc.' },
      { name: 'autoRenew', label: 'Auto-renovar', type: 'checkbox' },
      { name: 'status', label: 'Estado', type: 'select', options: [
        { value: 'active', label: 'Activo' },
        { value: 'expired', label: 'Vencido' },
        { value: 'pending_transfer', label: 'Transferencia Pendiente' },
        { value: 'locked', label: 'Bloqueado' }
      ], required: true },
      { name: 'reminderDays', label: 'Recordar X días antes', type: 'number', placeholder: '30' },
      { name: 'notes', label: 'Notas', type: 'textarea', rows: 2 }
    ],
    data: domain,
    onSubmit: (values) => {
      if (domainId) {
        const success = domainsService.update(domainId, values);
        if (success) this.navigate('domains');
        return success;
      } else {
        const newDomain = domainsService.create(values);
        if (newDomain) this.navigate('domains');
        return newDomain !== null;
      }
    }
  });
}

renderHosting(container) {
  const hosting = hostingService.getAll();
  const clients = clientsService.getAll();
  const stats = hostingService.getStats();
  
  container.innerHTML = `
    <div style="margin-bottom: var(--space-lg);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
        <div>
          <h2 style="font-size: var(--font-size-xl); font-weight: 700; margin-bottom: 4px;">Hosting</h2>
          <p style="color: var(--color-text-secondary);">${hosting.length} plan${hosting.length !== 1 ? 'es' : ''} de hosting</p>
        </div>
        <button class="btn btn-primary" onclick="window.app.openHostingForm()">
          <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nuevo Hosting
        </button>
      </div>
      
      <div class="grid grid-cols-4" style="margin-bottom: var(--space-lg);">
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Activos</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-success);">${stats.active}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Suspendidos</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-warning);">${stats.suspended}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Cancelados</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-text-tertiary);">${stats.cancelled}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Total</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-text-primary);">${stats.total}</div>
        </div>
      </div>
    </div>
    
    ${hosting.length > 0 ? `
      <div class="card">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--color-border-primary);">
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Proveedor / Plan</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Cliente</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Servidor</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Renovación</th>
              <th style="text-align: right; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Costo</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Estado</th>
              <th style="text-align: right; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${hosting.map(host => {
              const client = clients.find(c => c.id === host.clientId);
              return `
                <tr style="border-bottom: 1px solid var(--color-border-secondary);">
                  <td style="padding: var(--space-sm);">
                    <div style="font-weight: 600;">${host.provider}</div>
                    <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">${host.plan}</div>
                  </td>
                  <td style="padding: var(--space-sm); color: var(--color-text-secondary);">${client?.name || '-'}</td>
                  <td style="padding: var(--space-sm); color: var(--color-text-secondary);">${host.server || '-'}</td>
                  <td style="padding: var(--space-sm); color: var(--color-text-secondary);">${formatDate(host.renewalDate)}</td>
                  <td style="padding: var(--space-sm); text-align: right; font-weight: 600;">${formatCurrency(host.cost)}</td>
                  <td style="padding: var(--space-sm);">
                    <span style="padding: 4px 8px; background: ${getStatusBgColor(host.status)}; color: ${getStatusColor(host.status)}; border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-weight: 600; text-transform: capitalize;">${host.status}</span>
                  </td>
                  <td style="padding: var(--space-sm); text-align: right;">
                    <button class="btn-icon" onclick="window.app.openHostingForm('${host.id}')" title="Editar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button class="btn-icon" onclick="if(confirm('¿Eliminar?')) { hostingService.delete('${host.id}'); window.app.navigate('hosting'); }" title="Eliminar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    ` : `
      <div class="card" style="text-align: center; padding: var(--space-2xl);">
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-md);">No hay planes de hosting registrados</p>
        <button class="btn btn-primary" onclick="window.app.openHostingForm()">Agregar Primer Hosting</button>
      </div>
    `}
  `;
}

openHostingForm(hostingId = null) {
  const hosting = hostingId ? hostingService.getById(hostingId) : {};
  const clients = clientsService.getAll({ status: 'active' });
  
  modal.createForm({
    title: hostingId ? 'Editar Hosting' : 'Nuevo Hosting',
    fields: [
      { name: 'clientId', label: 'Cliente', type: 'select', options: clients.map(c => ({ value: c.id, label: c.name })), required: true },
      { name: 'provider', label: 'Proveedor', type: 'text', required: true, placeholder: 'AWS, DigitalOcean, Hostinger...' },
      { name: 'plan', label: 'Plan', type: 'text', required: true, placeholder: 'Basic, Premium, Enterprise...' },
      { name: 'server', label: 'Servidor', type: 'text', placeholder: 'us-east-1, server-01...' },
      { name: 'ipAddress', label: 'Dirección IP', type: 'text', placeholder: '192.168.1.1' },
      { name: 'storage', label: 'Almacenamiento', type: 'text', placeholder: '10GB, 100GB, 1TB...' },
      { name: 'bandwidth', label: 'Ancho de Banda', type: 'text', placeholder: 'Ilimitado, 1TB/mes...' },
      { name: 'startDate', label: 'Fecha de Inicio', type: 'date', required: true },
      { name: 'renewalDate', label: 'Fecha de Renovación', type: 'date', required: true },
      { name: 'cost', label: 'Costo', type: 'number', required: true, placeholder: '0.00' },
      { name: 'billingCycle', label: 'Ciclo', type: 'select', options: [
        { value: 'monthly', label: 'Mensual' },
        { value: 'annual', label: 'Anual' }
      ], required: true },
      { name: 'cpanelUrl', label: 'URL cPanel', type: 'url', placeholder: 'https://...' },
      { name: 'ftpHost', label: 'FTP Host', type: 'text', placeholder: 'ftp.example.com' },
      { name: 'status', label: 'Estado', type: 'select', options: [
        { value: 'active', label: 'Activo' },
        { value: 'suspended', label: 'Suspendido' },
        { value: 'cancelled', label: 'Cancelado' }
      ], required: true },
      { name: 'notes', label: 'Notas', type: 'textarea', rows: 2 }
    ],
    data: hosting,
    onSubmit: (values) => {
      if (hostingId) {
        const success = hostingService.update(hostingId, values);
        if (success) this.navigate('hosting');
        return success;
      } else {
        const newHosting = hostingService.create(values);
        if (newHosting) this.navigate('hosting');
        return newHosting !== null;
      }
    }
  });
}

renderLicenses(container) {
  const licenses = licensesService.getAll();
  const clients = clientsService.getAll();
  const stats = licensesService.getStats();
  
  container.innerHTML = `
    <div style="margin-bottom: var(--space-lg);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
        <div>
          <h2 style="font-size: var(--font-size-xl); font-weight: 700; margin-bottom: 4px;">Licencias</h2>
          <p style="color: var(--color-text-secondary);">${licenses.length} licencia${licenses.length !== 1 ? 's' : ''} registrada${licenses.length !== 1 ? 's' : ''}</p>
        </div>
        <button class="btn btn-primary" onclick="window.app.openLicenseForm()">
          <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nueva Licencia
        </button>
      </div>
      
      <div class="grid grid-cols-4" style="margin-bottom: var(--space-lg);">
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Activas</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-success);">${stats.active}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Vencidas</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-error);">${stats.expired}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Total Seats</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-text-primary);">${stats.totalSeats}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Total</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-text-primary);">${stats.total}</div>
        </div>
      </div>
    </div>
    
    ${licenses.length > 0 ? `
      <div class="card">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--color-border-primary);">
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Licencia</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Cliente</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Tipo</th>
              <th style="text-align: center; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Seats</th>
              <th style="text-align: right; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Costo</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Estado</th>
              <th style="text-align: right; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${licenses.map(license => {
              const client = clients.find(c => c.id === license.clientId);
              return `
                <tr style="border-bottom: 1px solid var(--color-border-secondary);">
                  <td style="padding: var(--space-sm);">
                    <div style="font-weight: 600;">${license.name}</div>
                    <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">${license.provider}</div>
                  </td>
                  <td style="padding: var(--space-sm); color: var(--color-text-secondary);">${client?.name || '-'}</td>
                  <td style="padding: var(--space-sm);">
                    <span style="padding: 4px 8px; background: var(--color-bg-secondary); border-radius: var(--radius-sm); font-size: var(--font-size-xs); text-transform: capitalize;">${license.type.replace('_', ' ')}</span>
                  </td>
                  <td style="padding: var(--space-sm); text-align: center; font-weight: 600;">${license.seats}</td>
                  <td style="padding: var(--space-sm); text-align: right; font-weight: 600;">${formatCurrency(license.cost)}</td>
                  <td style="padding: var(--space-sm);">
                    <span style="padding: 4px 8px; background: ${getStatusBgColor(license.status)}; color: ${getStatusColor(license.status)}; border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-weight: 600; text-transform: capitalize;">${license.status}</span>
                  </td>
                  <td style="padding: var(--space-sm); text-align: right;">
                    <button class="btn-icon" onclick="window.app.openLicenseForm('${license.id}')" title="Editar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button class="btn-icon" onclick="if(confirm('¿Eliminar?')) { licensesService.delete('${license.id}'); window.app.navigate('licenses'); }" title="Eliminar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    ` : `
      <div class="card" style="text-align: center; padding: var(--space-2xl);">
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-md);">No hay licencias registradas</p>
        <button class="btn btn-primary" onclick="window.app.openLicenseForm()">Agregar Primera Licencia</button>
      </div>
    `}
  `;
}

openLicenseForm(licenseId = null) {
  const license = licenseId ? licensesService.getById(licenseId) : {};
  const clients = clientsService.getAll({ status: 'active' });
  
  modal.createForm({
    title: licenseId ? 'Editar Licencia' : 'Nueva Licencia',
    fields: [
      { name: 'clientId', label: 'Cliente', type: 'select', options: clients.map(c => ({ value: c.id, label: c.name })), required: true },
      { name: 'name', label: 'Nombre de la Licencia', type: 'text', required: true },
      { name: 'type', label: 'Tipo', type: 'select', options: [
        { value: 'google_workspace', label: 'Google Workspace' },
        { value: 'microsoft_365', label: 'Microsoft 365' },
        { value: 'plugin', label: 'Plugin' },
        { value: 'api', label: 'API' },
        { value: 'software', label: 'Software' },
        { value: 'other', label: 'Otro' }
      ], required: true },
      { name: 'provider', label: 'Proveedor', type: 'text', required: true },
      { name: 'licenseKey', label: 'Clave de Licencia', type: 'text' },
      { name: 'seats', label: 'Número de Seats', type: 'number', placeholder: '1' },
      { name: 'purchaseDate', label: 'Fecha de Compra', type: 'date', required: true },
      { name: 'expirationDate', label: 'Fecha de Expiración', type: 'date' },
      { name: 'renewalDate', label: 'Fecha de Renovación', type: 'date' },
      { name: 'cost', label: 'Costo', type: 'number', required: true, placeholder: '0.00' },
      { name: 'billingCycle', label: 'Ciclo', type: 'select', options: [
        { value: 'monthly', label: 'Mensual' },
        { value: 'annual', label: 'Anual' },
        { value: 'perpetual', label: 'Perpetua' }
      ], required: true },
      { name: 'autoRenew', label: 'Auto-renovar', type: 'checkbox' },
      { name: 'status', label: 'Estado', type: 'select', options: [
        { value: 'active', label: 'Activa' },
        { value: 'expired', label: 'Vencida' },
        { value: 'cancelled', label: 'Cancelada' }
      ], required: true },
      { name: 'notes', label: 'Notas', type: 'textarea', rows: 2 }
    ],
    data: license,
    onSubmit: (values) => {
      if (licenseId) {
        const success = licensesService.update(licenseId, values);
        if (success) this.navigate('licenses');
        return success;
      } else {
        const newLicense = licensesService.create(values);
        if (newLicense) this.navigate('licenses');
        return newLicense !== null;
      }
    }
  });
}

renderTickets(container) {
  const tickets = ticketsService.getAll();
  const clients = clientsService.getAll();
  const stats = ticketsService.getStats();
  
  container.innerHTML = `
    <div style="margin-bottom: var(--space-lg);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
        <div>
          <h2 style="font-size: var(--font-size-xl); font-weight: 700; margin-bottom: 4px;">Tickets de Soporte</h2>
          <p style="color: var(--color-text-secondary);">${tickets.length} ticket${tickets.length !== 1 ? 's' : ''} registrado${tickets.length !== 1 ? 's' : ''}</p>
        </div>
        <button class="btn btn-primary" onclick="window.app.openTicketForm()">
          <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nuevo Ticket
        </button>
      </div>
      
      <div class="grid grid-cols-5" style="margin-bottom: var(--space-lg);">
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Abiertos</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-warning);">${stats.open}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">En Progreso</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-info);">${stats.in_progress}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Resueltos</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-success);">${stats.resolved}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Cerrados</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-text-tertiary);">${stats.closed}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Urgentes</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-error);">${stats.urgent}</div>
        </div>
      </div>
    </div>
    
    ${tickets.length > 0 ? `
      <div class="card">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--color-border-primary);">
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Ticket</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Cliente</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Tipo</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Prioridad</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Estado</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Asignado a</th>
              <th style="text-align: right; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${tickets.map(ticket => {
              const client = clients.find(c => c.id === ticket.clientId);
              const priorityColors = {
                low: 'var(--color-success)',
                medium: 'var(--color-warning)',
                high: 'var(--color-error)',
                urgent: 'var(--color-error)'
              };
              const priorityLabels = {
                low: 'Baja',
                medium: 'Media',
                high: 'Alta',
                urgent: 'Urgente'
              };
              const statusLabels = {
                open: 'Abierto',
                in_progress: 'En Progreso',
                resolved: 'Resuelto',
                closed: 'Cerrado'
              };
              
              return `
                <tr style="border-bottom: 1px solid var(--color-border-secondary);">
                  <td style="padding: var(--space-sm);">
                    <div style="font-weight: 600; margin-bottom: 2px;">#${ticket.id.slice(0,8)} - ${ticket.title}</div>
                    ${ticket.description ? `<div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">${truncate(ticket.description, 50)}</div>` : ''}
                  </td>
                  <td style="padding: var(--space-sm); color: var(--color-text-secondary);">${client?.name || '-'}</td>
                  <td style="padding: var(--space-sm);">
                    <span style="padding: 4px 8px; background: var(--color-bg-secondary); border-radius: var(--radius-sm); font-size: var(--font-size-xs); text-transform: capitalize;">${ticket.type.replace('_', ' ')}</span>
                  </td>
                  <td style="padding: var(--space-sm);">
                    <span style="padding: 4px 8px; background: ${priorityColors[ticket.priority]}20; color: ${priorityColors[ticket.priority]}; border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-weight: 600;">
                      ${priorityLabels[ticket.priority]}
                    </span>
                  </td>
                  <td style="padding: var(--space-sm);">
                    <span style="padding: 4px 8px; background: ${getStatusBgColor(ticket.status)}; color: ${getStatusColor(ticket.status)}; border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-weight: 600;">
                      ${statusLabels[ticket.status]}
                    </span>
                  </td>
                  <td style="padding: var(--space-sm); color: var(--color-text-secondary);">${ticket.assignedTo || 'Sin asignar'}</td>
                  <td style="padding: var(--space-sm); text-align: right;">
                    <button class="btn-icon" onclick="window.app.openTicketForm('${ticket.id}')" title="Editar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button class="btn-icon" onclick="if(confirm('¿Eliminar?')) { ticketsService.delete('${ticket.id}'); window.app.navigate('tickets'); }" title="Eliminar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    ` : `
      <div class="card" style="text-align: center; padding: var(--space-2xl);">
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-md);">No hay tickets registrados</p>
        <button class="btn btn-primary" onclick="window.app.openTicketForm()">Crear Primer Ticket</button>
      </div>
    `}
  `;
}

openTicketForm(ticketId = null) {
  const ticket = ticketId ? ticketsService.getById(ticketId) : {};
  const clients = clientsService.getAll({ status: 'active' });
  
  modal.createForm({
    title: ticketId ? 'Editar Ticket' : 'Nuevo Ticket',
    fields: [
      { name: 'clientId', label: 'Cliente', type: 'select', options: clients.map(c => ({ value: c.id, label: c.name })), required: true },
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'description', label: 'Descripción', type: 'textarea', rows: 4, required: true },
      { name: 'type', label: 'Tipo', type: 'select', options: [
        { value: 'bug', label: 'Bug / Error' },
        { value: 'feature', label: 'Nueva Funcionalidad' },
        { value: 'support', label: 'Soporte Técnico' },
        { value: 'question', label: 'Consulta' },
        { value: 'maintenance', label: 'Mantenimiento' }
      ], required: true },
      { name: 'priority', label: 'Prioridad', type: 'select', options: [
        { value: 'low', label: 'Baja' },
        { value: 'medium', label: 'Media' },
        { value: 'high', label: 'Alta' },
        { value: 'urgent', label: 'Urgente' }
      ], required: true },
      { name: 'status', label: 'Estado', type: 'select', options: [
        { value: 'open', label: 'Abierto' },
        { value: 'in_progress', label: 'En Progreso' },
        { value: 'resolved', label: 'Resuelto' },
        { value: 'closed', label: 'Cerrado' }
      ], required: true },
      { name: 'assignedTo', label: 'Asignar a', type: 'text', placeholder: 'Nombre del técnico' },
      { name: 'estimatedHours', label: 'Horas Estimadas', type: 'number', placeholder: '0' },
      { name: 'dueDate', label: 'Fecha Límite', type: 'date' },
      { name: 'tags', label: 'Etiquetas (separadas por coma)', type: 'text', placeholder: 'wordpress, hosting, email' },
      { name: 'notes', label: 'Notas Adicionales', type: 'textarea', rows: 2 }
    ],
    data: ticket,
    onSubmit: (values) => {
      // Convertir tags de string a array
      if (values.tags && typeof values.tags === 'string') {
        values.tags = values.tags.split(',').map(t => t.trim()).filter(t => t);
      }
      
      if (ticketId) {
        const success = ticketsService.update(ticketId, values);
        if (success) this.navigate('tickets');
        return success;
      } else {
        const newTicket = ticketsService.create(values);
        if (newTicket) this.navigate('tickets');
        return newTicket !== null;
      }
    }
  });
}

renderPayments(container) {
  const payments = paymentsService.getAll();
  const clients = clientsService.getAll();
  const stats = paymentsService.getStats();
  
  container.innerHTML = `
    <div style="margin-bottom: var(--space-lg);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md);">
        <div>
          <h2 style="font-size: var(--font-size-xl); font-weight: 700; margin-bottom: 4px;">Pagos y Facturación</h2>
          <p style="color: var(--color-text-secondary);">${payments.length} pago${payments.length !== 1 ? 's' : ''} registrado${payments.length !== 1 ? 's' : ''}</p>
        </div>
        <button class="btn btn-primary" onclick="window.app.openPaymentForm()">
          <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nuevo Pago
        </button>
      </div>
      
      <div class="grid grid-cols-4" style="margin-bottom: var(--space-lg);">
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Pendientes</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-warning);">${stats.pending}</div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-top: 4px;">${formatCurrency(stats.totalPending)}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Vencidos</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-error);">${stats.overdue}</div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-top: 4px;">${formatCurrency(stats.totalOverdue)}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Pagados</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-success);">${stats.paid}</div>
        </div>
        <div class="card">
          <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: 4px;">Total</div>
          <div style="font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-text-primary);">${stats.total}</div>
        </div>
      </div>
    </div>
    
    ${payments.length > 0 ? `
      <div class="card">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--color-border-primary);">
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Factura</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Cliente</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Descripción</th>
              <th style="text-align: right; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Monto</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Vencimiento</th>
              <th style="text-align: left; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Estado</th>
              <th style="text-align: right; padding: var(--space-sm); font-size: var(--font-size-sm); color: var(--color-text-secondary); font-weight: 600;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${payments.map(payment => {
              const client = clients.find(c => c.id === payment.clientId);
              const isOverdue = payment.status === 'pending' && new Date(payment.dueDate) < new Date();
              
              return `
                <tr style="border-bottom: 1px solid var(--color-border-secondary);">
                  <td style="padding: var(--space-sm); font-weight: 600;">${payment.invoiceNumber}</td>
                  <td style="padding: var(--space-sm); color: var(--color-text-secondary);">${client?.name || '-'}</td>
                  <td style="padding: var(--space-sm); color: var(--color-text-secondary);">${truncate(payment.description, 40)}</td>
                  <td style="padding: var(--space-sm); text-align: right; font-weight: 700; color: var(--color-text-primary);">${formatCurrency(payment.amount, payment.currency)}</td>
                  <td style="padding: var(--space-sm);">
                    <div style="color: ${isOverdue ? 'var(--color-error)' : 'var(--color-text-secondary)'};">${formatDate(payment.dueDate)}</div>
                    ${payment.paidDate ? `<div style="font-size: var(--font-size-xs); color: var(--color-success);">Pagado: ${formatDate(payment.paidDate)}</div>` : ''}
                  </td>
                  <td style="padding: var(--space-sm);">
                    <span style="padding: 4px 8px; background: ${getStatusBgColor(payment.status)}; color: ${getStatusColor(payment.status)}; border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-weight: 600; text-transform: capitalize;">
                      ${payment.status === 'paid' ? 'Pagado' : payment.status === 'pending' ? 'Pendiente' : 'Vencido'}
                    </span>
                  </td>
                  <td style="padding: var(--space-sm); text-align: right;">
                    ${payment.status !== 'paid' ? `
                      <button 
                        class="btn-icon" 
                        onclick="if(confirm('¿Marcar como pagado?')) { paymentsService.markAsPaid('${payment.id}'); window.app.navigate('payments'); }" 
                        title="Marcar como Pagado"
                        style="color: var(--color-success);"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </button>
                    ` : ''}
                    <button class="btn-icon" onclick="window.app.openPaymentForm('${payment.id}')" title="Editar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button class="btn-icon" onclick="if(confirm('¿Eliminar?')) { paymentsService.delete('${payment.id}'); window.app.navigate('payments'); }" title="Eliminar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    ` : `
      <div class="card" style="text-align: center; padding: var(--space-2xl);">
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-md);">No hay pagos registrados</p>
        <button class="btn btn-primary" onclick="window.app.openPaymentForm()">Registrar Primer Pago</button>
      </div>
    `}
  `;
}

openPaymentForm(paymentId = null) {
  const payment = paymentId ? paymentsService.getById(paymentId) : {};
  const clients = clientsService.getAll({ status: 'active' });
  
  modal.createForm({
    title: paymentId ? 'Editar Pago' : 'Nuevo Pago',
    fields: [
      { name: 'clientId', label: 'Cliente', type: 'select', options: clients.map(c => ({ value: c.id, label: c.name })), required: true },
      { name: 'invoiceNumber', label: 'Número de Factura', type: 'text', required: true, placeholder: 'INV-001' },
      { name: 'description', label: 'Descripción', type: 'text', required: true, placeholder: 'Hosting mensual, Desarrollo web...' },
      { name: 'amount', label: 'Monto', type: 'number', required: true, placeholder: '0.00' },
      { name: 'currency', label: 'Moneda', type: 'select', options: [
        { value: 'USD', label: 'USD' },
        { value: 'EUR', label: 'EUR' },
        { value: 'MXN', label: 'MXN' }
      ] },
      { name: 'dueDate', label: 'Fecha de Vencimiento', type: 'date', required: true },
      { name: 'status', label: 'Estado', type: 'select', options: [
        { value: 'pending', label: 'Pendiente' },
        { value: 'paid', label: 'Pagado' },
        { value: 'overdue', label: 'Vencido' }
      ], required: true },
      { name: 'paidDate', label: 'Fecha de Pago', type: 'date' },
      { name: 'paymentMethod', label: 'Método de Pago', type: 'select', options: [
        { value: 'bank_transfer', label: 'Transferencia Bancaria' },
        { value: 'credit_card', label: 'Tarjeta de Crédito' },
        { value: 'paypal', label: 'PayPal' },
        { value: 'cash', label: 'Efectivo' },
        { value: 'check', label: 'Cheque' },
        { value: 'other', label: 'Otro' }
      ] },
      { name: 'transactionId', label: 'ID de Transacción', type: 'text', placeholder: 'TXN-123456' },
      { name: 'notes', label: 'Notas', type: 'textarea', rows: 2 }
    ],
    data: payment,
    onSubmit: (values) => {
      if (paymentId) {
        const success = paymentsService.update(paymentId, values);
        if (success) this.navigate('payments');
        return success;
      } else {
        const newPayment = paymentsService.create(values);
        if (newPayment) this.navigate('payments');
        return newPayment !== null;
      }
    }
  });
}

  render404(container) {
    this.renderPlaceholder(container, '404', 'Página no encontrada');
  }

  renderPlaceholder(container, title, message) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: var(--space-2xl);">
        <h2 style="font-size: var(--font-size-2xl); font-weight: 700; margin-bottom: var(--space-md);">${title}</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-lg);">${message}</p>
        <button class="btn btn-secondary" onclick="window.location.hash = '#/dashboard'">Volver al Dashboard</button>
      </div>
    `;
  }

  /**
   * Utilidad sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
