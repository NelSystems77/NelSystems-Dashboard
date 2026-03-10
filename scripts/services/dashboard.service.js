/**
 * NELSYSTEMS DASHBOARD - DASHBOARD SERVICE
 * 
 * Servicio para generar métricas y estadísticas del dashboard
 */

import db from '../database/db.js';
import { daysUntil, addMonths, formatCurrency } from '../utils/helpers.js';

class DashboardService {
  /**
   * Obtiene todas las métricas del dashboard
   */
  getMetrics() {
    return {
      clients: this.getClientsMetrics(),
      services: this.getServicesMetrics(),
      financial: this.getFinancialMetrics(),
      upcoming: this.getUpcomingRenewals(),
      alerts: this.getAlerts(),
      projects: this.getProjectsMetrics(),
      tickets: this.getTicketsMetrics()
    };
  }

  /**
   * Métricas de clientes
   */
  getClientsMetrics() {
    const clients = db.select('clients');
    const activeClients = clients.filter(c => c.status === 'active');
    
    // Calcular nuevos clientes este mes
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = clients.filter(c => new Date(c.createdAt) >= firstDayOfMonth);
    
    return {
      total: clients.length,
      active: activeClients.length,
      inactive: clients.filter(c => c.status === 'inactive').length,
      suspended: clients.filter(c => c.status === 'suspended').length,
      newThisMonth: newThisMonth.length
    };
  }

  /**
   * Métricas de servicios
   */
  getServicesMetrics() {
    const services = db.select('services');
    const activeServices = services.filter(s => s.status === 'active');
    
    // Contar por tipo
    const byType = {};
    activeServices.forEach(service => {
      byType[service.type] = (byType[service.type] || 0) + 1;
    });
    
    return {
      total: services.length,
      active: activeServices.length,
      expired: services.filter(s => s.status === 'expired').length,
      cancelled: services.filter(s => s.status === 'cancelled').length,
      byType
    };
  }

  /**
   * Métricas financieras
   */
  getFinancialMetrics() {
    const services = db.select('services', { status: 'active' });
    const payments = db.select('payments');
    
    // Calcular ingresos mensuales estimados
    let monthlyRevenue = 0;
    services.forEach(service => {
      if (service.billingCycle === 'monthly') {
        monthlyRevenue += service.amount;
      } else if (service.billingCycle === 'annual') {
        monthlyRevenue += service.amount / 12;
      } else if (service.billingCycle === 'quarterly') {
        monthlyRevenue += service.amount / 3;
      } else if (service.billingCycle === 'biannual') {
        monthlyRevenue += service.amount / 6;
      }
    });
    
    // Calcular ingresos anuales
    const annualRevenue = monthlyRevenue * 12;
    
    // Pagos pendientes
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const overduePayments = payments.filter(p => p.status === 'overdue');
    
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Pagos del mes actual
    const now = new Date();
    const paidThisMonth = payments.filter(p => {
      if (!p.paidDate) return false;
      const paidDate = new Date(p.paidDate);
      return paidDate.getMonth() === now.getMonth() && 
             paidDate.getFullYear() === now.getFullYear();
    });
    
    const totalPaidThisMonth = paidThisMonth.reduce((sum, p) => sum + p.amount, 0);
    
    return {
      monthlyRevenue,
      annualRevenue,
      pendingPayments: pendingPayments.length,
      totalPending,
      overduePayments: overduePayments.length,
      totalOverdue,
      paidThisMonth: paidThisMonth.length,
      totalPaidThisMonth
    };
  }

  /**
   * Próximas renovaciones (30 días)
   */
  getUpcomingRenewals() {
    const services = db.select('services', { status: 'active' });
    const domains = db.select('domains', { status: 'active' });
    const hosting = db.select('hosting', { status: 'active' });
    const licenses = db.select('licenses', { status: 'active' });
    
    const upcoming = [];
    
    // Servicios
    services.forEach(service => {
      if (service.endDate) {
        const days = daysUntil(service.endDate);
        if (days >= 0 && days <= 30) {
          const client = db.selectById('clients', service.clientId);
          upcoming.push({
            type: 'service',
            id: service.id,
            name: service.name,
            client: client?.name || 'Sin cliente',
            date: service.endDate,
            daysLeft: days,
            amount: service.amount,
            priority: days <= 7 ? 'high' : days <= 15 ? 'medium' : 'low'
          });
        }
      }
    });
    
    // Dominios
    domains.forEach(domain => {
      const days = daysUntil(domain.expirationDate);
      if (days >= 0 && days <= 30) {
        const client = db.selectById('clients', domain.clientId);
        upcoming.push({
          type: 'domain',
          id: domain.id,
          name: domain.domain,
          client: client?.name || 'Sin cliente',
          date: domain.expirationDate,
          daysLeft: days,
          amount: domain.price || 0,
          priority: days <= 7 ? 'high' : days <= 15 ? 'medium' : 'low'
        });
      }
    });
    
    // Hosting
    hosting.forEach(host => {
      const days = daysUntil(host.renewalDate);
      if (days >= 0 && days <= 30) {
        const client = db.selectById('clients', host.clientId);
        upcoming.push({
          type: 'hosting',
          id: host.id,
          name: `${host.provider} - ${host.plan}`,
          client: client?.name || 'Sin cliente',
          date: host.renewalDate,
          daysLeft: days,
          amount: host.cost,
          priority: days <= 7 ? 'high' : days <= 15 ? 'medium' : 'low'
        });
      }
    });
    
    // Licencias
    licenses.forEach(license => {
      if (license.renewalDate) {
        const days = daysUntil(license.renewalDate);
        if (days >= 0 && days <= 30) {
          const client = db.selectById('clients', license.clientId);
          upcoming.push({
            type: 'license',
            id: license.id,
            name: license.name,
            client: client?.name || 'Sin cliente',
            date: license.renewalDate,
            daysLeft: days,
            amount: license.cost,
            priority: days <= 7 ? 'high' : days <= 15 ? 'medium' : 'low'
          });
        }
      }
    });
    
    // Ordenar por días restantes
    return upcoming.sort((a, b) => a.daysLeft - b.daysLeft);
  }

  /**
   * Alertas importantes
   */
  getAlerts() {
    const alerts = [];
    
    // Servicios vencidos
    const expiredServices = db.select('services', { status: 'expired' });
    if (expiredServices.length > 0) {
      alerts.push({
        type: 'error',
        title: 'Servicios vencidos',
        message: `${expiredServices.length} servicio(s) vencido(s) requieren atención`,
        count: expiredServices.length
      });
    }
    
    // Pagos vencidos
    const overduePayments = db.select('payments', { status: 'overdue' });
    if (overduePayments.length > 0) {
      const total = overduePayments.reduce((sum, p) => sum + p.amount, 0);
      alerts.push({
        type: 'error',
        title: 'Pagos vencidos',
        message: `${overduePayments.length} pago(s) vencido(s) - Total: ${formatCurrency(total)}`,
        count: overduePayments.length
      });
    }
    
    // Dominios próximos a vencer (7 días)
    const criticalDomains = db.select('domains', { status: 'active' })
      .filter(d => {
        const days = daysUntil(d.expirationDate);
        return days >= 0 && days <= 7;
      });
    
    if (criticalDomains.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Dominios críticos',
        message: `${criticalDomains.length} dominio(s) vence(n) en menos de 7 días`,
        count: criticalDomains.length
      });
    }
    
    // Tickets urgentes abiertos
    const urgentTickets = db.select('tickets')
      .filter(t => t.priority === 'urgent' && t.status !== 'closed' && t.status !== 'resolved');
    
    if (urgentTickets.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Tickets urgentes',
        message: `${urgentTickets.length} ticket(s) urgente(s) sin resolver`,
        count: urgentTickets.length
      });
    }
    
    return alerts;
  }

  /**
   * Métricas de proyectos
   */
  getProjectsMetrics() {
    const projects = db.select('projects');
    
    return {
      total: projects.length,
      inProgress: projects.filter(p => p.status === 'in_progress').length,
      deployed: projects.filter(p => p.status === 'deployed').length,
      maintenance: projects.filter(p => p.status === 'maintenance').length,
      cancelled: projects.filter(p => p.status === 'cancelled').length
    };
  }

  /**
   * Métricas de tickets
   */
  getTicketsMetrics() {
    const tickets = db.select('tickets');
    
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      urgent: tickets.filter(t => t.priority === 'urgent' && t.status !== 'closed').length
    };
  }

  /**
   * Gráfico de ingresos mensuales (últimos 6 meses)
   */
  getRevenueChart() {
    const payments = db.select('payments', { status: 'paid' });
    const months = [];
    const now = new Date();
    
    // Generar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('es-ES', { month: 'short' });
      
      const monthPayments = payments.filter(p => {
        const paidDate = new Date(p.paidDate);
        return paidDate.getMonth() === date.getMonth() &&
               paidDate.getFullYear() === date.getFullYear();
      });
      
      const total = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      
      months.push({
        month: monthName,
        revenue: total,
        count: monthPayments.length
      });
    }
    
    return months;
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
