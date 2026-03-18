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
import { formatCurrency, formatDate, getStatusColor, getInitials, showToast } from './utils/helpers.js';
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
    this.renderPlaceholder(container, 'Proyectos', 'Esta sección está en desarrollo');
  }

  renderServices(container) {
    this.renderPlaceholder(container, 'Servicios', 'Esta sección está en desarrollo');
  }

  renderDomains(container) {
    this.renderPlaceholder(container, 'Dominios', 'Esta sección está en desarrollo');
  }

  renderHosting(container) {
    this.renderPlaceholder(container, 'Hosting', 'Esta sección está en desarrollo');
  }

  renderLicenses(container) {
    this.renderPlaceholder(container, 'Licencias', 'Esta sección está en desarrollo');
  }

  renderTickets(container) {
    this.renderPlaceholder(container, 'Tickets', 'Esta sección está en desarrollo');
  }

  renderPayments(container) {
    this.renderPlaceholder(container, 'Pagos', 'Esta sección está en desarrollo');
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
