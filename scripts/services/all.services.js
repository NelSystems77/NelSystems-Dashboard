/**
 * NELSYSTEMS DASHBOARD - ALL SERVICES
 * Servicios completos para todos los módulos
 */

import db from '../database/db.js';
import { showToast, daysUntil, addYears } from '../utils/helpers.js';

// ==================== DOMAINS SERVICE ====================
class DomainsService {
  getAll(filters = {}) {
    let domains = db.select('domains');
    if (filters.status) domains = domains.filter(d => d.status === filters.status);
    if (filters.clientId) domains = domains.filter(d => d.clientId === filters.clientId);
    if (filters.search) {
      const search = filters.search.toLowerCase();
      domains = domains.filter(d => d.domain.toLowerCase().includes(search));
    }
    return domains.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
  }

  getById(id) { return db.selectById('domains', id); }

  create(domainData) {
    try {
      if (!domainData.domain || !domainData.clientId || !domainData.registrar || !domainData.expirationDate) {
        showToast('Datos incompletos', 'error');
        return null;
      }

      const domain = db.insert('domains', {
        clientId: domainData.clientId,
        serviceId: domainData.serviceId || null,
        domain: domainData.domain.toLowerCase().trim(),
        registrar: domainData.registrar.trim(),
        registrationDate: domainData.registrationDate,
        expirationDate: domainData.expirationDate,
        autoRenew: domainData.autoRenew !== false,
        dnsProvider: domainData.dnsProvider?.trim() || null,
        nameservers: domainData.nameservers || null,
        status: domainData.status || 'active',
        price: domainData.price ? parseFloat(domainData.price) : null,
        reminderDays: domainData.reminderDays || 30,
        notes: domainData.notes?.trim() || null
      });

      showToast('Dominio creado exitosamente', 'success');
      return domain;
    } catch (error) {
      console.error('Error creating domain:', error);
      showToast('Error al crear dominio', 'error');
      return null;
    }
  }

  update(id, updates) {
    try {
      const count = db.updateById('domains', id, updates);
      if (count > 0) {
        showToast('Dominio actualizado exitosamente', 'success');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating domain:', error);
      showToast('Error al actualizar dominio', 'error');
      return false;
    }
  }

  delete(id) {
    try {
      const count = db.deleteById('domains', id);
      if (count > 0) {
        showToast('Dominio eliminado exitosamente', 'success');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting domain:', error);
      showToast('Error al eliminar dominio', 'error');
      return false;
    }
  }

  getExpiringSoon(days = 30) {
    return this.getAll({ status: 'active' }).filter(d => {
      const daysLeft = daysUntil(d.expirationDate);
      return daysLeft >= 0 && daysLeft <= days;
    });
  }
}

// ==================== HOSTING SERVICE ====================
class HostingService {
  getAll(filters = {}) {
    let hosting = db.select('hosting');
    if (filters.status) hosting = hosting.filter(h => h.status === filters.status);
    if (filters.clientId) hosting = hosting.filter(h => h.clientId === filters.clientId);
    if (filters.provider) hosting = hosting.filter(h => h.provider === filters.provider);
    return hosting.sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));
  }

  getById(id) { return db.selectById('hosting', id); }

  create(hostingData) {
    try {
      if (!hostingData.clientId || !hostingData.provider || !hostingData.plan) {
        showToast('Datos incompletos', 'error');
        return null;
      }

      const hosting = db.insert('hosting', {
        clientId: hostingData.clientId,
        serviceId: hostingData.serviceId || null,
        provider: hostingData.provider.trim(),
        plan: hostingData.plan.trim(),
        server: hostingData.server?.trim() || null,
        ipAddress: hostingData.ipAddress?.trim() || null,
        storage: hostingData.storage?.trim() || null,
        bandwidth: hostingData.bandwidth?.trim() || null,
        startDate: hostingData.startDate,
        renewalDate: hostingData.renewalDate,
        cost: parseFloat(hostingData.cost),
        billingCycle: hostingData.billingCycle,
        status: hostingData.status || 'active',
        cpanelUrl: hostingData.cpanelUrl?.trim() || null,
        ftpHost: hostingData.ftpHost?.trim() || null,
        notes: hostingData.notes?.trim() || null
      });

      showToast('Hosting creado exitosamente', 'success');
      return hosting;
    } catch (error) {
      console.error('Error creating hosting:', error);
      showToast('Error al crear hosting', 'error');
      return null;
    }
  }

  update(id, updates) {
    try {
      const count = db.updateById('hosting', id, updates);
      if (count > 0) {
        showToast('Hosting actualizado exitosamente', 'success');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating hosting:', error);
      showToast('Error al actualizar hosting', 'error');
      return false;
    }
  }

  delete(id) {
    try {
      const count = db.deleteById('hosting', id);
      if (count > 0) {
        showToast('Hosting eliminado exitosamente', 'success');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting hosting:', error);
      showToast('Error al eliminar hosting', 'error');
      return false;
    }
  }
}

// ==================== LICENSES SERVICE ====================
class LicensesService {
  getAll(filters = {}) {
    let licenses = db.select('licenses');
    if (filters.status) licenses = licenses.filter(l => l.status === filters.status);
    if (filters.clientId) licenses = licenses.filter(l => l.clientId === filters.clientId);
    if (filters.type) licenses = licenses.filter(l => l.type === filters.type);
    return licenses.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getById(id) { return db.selectById('licenses', id); }

  create(licenseData) {
    try {
      if (!licenseData.clientId || !licenseData.name || !licenseData.type) {
        showToast('Datos incompletos', 'error');
        return null;
      }

      const license = db.insert('licenses', {
        clientId: licenseData.clientId,
        serviceId: licenseData.serviceId || null,
        name: licenseData.name.trim(),
        type: licenseData.type,
        provider: licenseData.provider.trim(),
        licenseKey: licenseData.licenseKey?.trim() || null,
        seats: parseInt(licenseData.seats) || 1,
        purchaseDate: licenseData.purchaseDate,
        expirationDate: licenseData.expirationDate || null,
        renewalDate: licenseData.renewalDate || null,
        cost: parseFloat(licenseData.cost),
        billingCycle: licenseData.billingCycle,
        status: licenseData.status || 'active',
        autoRenew: licenseData.autoRenew !== false,
        notes: licenseData.notes?.trim() || null
      });

      showToast('Licencia creada exitosamente', 'success');
      return license;
    } catch (error) {
      console.error('Error creating license:', error);
      showToast('Error al crear licencia', 'error');
      return null;
    }
  }

  update(id, updates) {
    try {
      const count = db.updateById('licenses', id, updates);
      if (count > 0) {
        showToast('Licencia actualizada exitosamente', 'success');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating license:', error);
      showToast('Error al actualizar licencia', 'error');
      return false;
    }
  }

  delete(id) {
    try {
      const count = db.deleteById('licenses', id);
      if (count > 0) {
        showToast('Licencia eliminada exitosamente', 'success');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting license:', error);
      showToast('Error al eliminar licencia', 'error');
      return false;
    }
  }
}

// ==================== TICKETS SERVICE ====================
class TicketsService {
  getAll(filters = {}) {
    let tickets = db.select('tickets');
    if (filters.status) tickets = tickets.filter(t => t.status === filters.status);
    if (filters.priority) tickets = tickets.filter(t => t.priority === filters.priority);
    if (filters.clientId) tickets = tickets.filter(t => t.clientId === filters.clientId);
    if (filters.assignedTo) tickets = tickets.filter(t => t.assignedTo === filters.assignedTo);
    return tickets.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getById(id) { return db.selectById('tickets', id); }

  create(ticketData) {
    try {
      if (!ticketData.clientId || !ticketData.title || !ticketData.type) {
        showToast('Datos incompletos', 'error');
        return null;
      }

      const ticket = db.insert('tickets', {
        clientId: ticketData.clientId,
        projectId: ticketData.projectId || null,
        serviceId: ticketData.serviceId || null,
        title: ticketData.title.trim(),
        description: ticketData.description.trim(),
        type: ticketData.type,
        priority: ticketData.priority || 'medium',
        status: ticketData.status || 'open',
        assignedTo: ticketData.assignedTo || null,
        estimatedHours: ticketData.estimatedHours ? parseFloat(ticketData.estimatedHours) : null,
        actualHours: null,
        dueDate: ticketData.dueDate || null,
        resolvedAt: null,
        closedAt: null,
        tags: ticketData.tags || null,
        attachments: ticketData.attachments || null
      });

      showToast('Ticket creado exitosamente', 'success');
      return ticket;
    } catch (error) {
      console.error('Error creating ticket:', error);
      showToast('Error al crear ticket', 'error');
      return null;
    }
  }

  update(id, updates) {
    try {
      if (updates.status === 'resolved' && !updates.resolvedAt) {
        updates.resolvedAt = new Date().toISOString();
      }
      if (updates.status === 'closed' && !updates.closedAt) {
        updates.closedAt = new Date().toISOString();
      }

      const count = db.updateById('tickets', id, updates);
      if (count > 0) {
        showToast('Ticket actualizado exitosamente', 'success');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating ticket:', error);
      showToast('Error al actualizar ticket', 'error');
      return false;
    }
  }

  delete(id) {
    try {
      const count = db.deleteById('tickets', id);
      if (count > 0) {
        showToast('Ticket eliminado exitosamente', 'success');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting ticket:', error);
      showToast('Error al eliminar ticket', 'error');
      return false;
    }
  }

  getStats() {
    const tickets = this.getAll();
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length,
      urgent: tickets.filter(t => t.priority === 'urgent').length
    };
  }
}

// ==================== PAYMENTS SERVICE ====================
class PaymentsService {
  getAll(filters = {}) {
    let payments = db.select('payments');
    if (filters.status) payments = payments.filter(p => p.status === filters.status);
    if (filters.clientId) payments = payments.filter(p => p.clientId === filters.clientId);
    return payments.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
  }

  getById(id) { return db.selectById('payments', id); }

  create(paymentData) {
    try {
      if (!paymentData.clientId || !paymentData.invoiceNumber || !paymentData.amount) {
        showToast('Datos incompletos', 'error');
        return null;
      }

      // Verificar invoice único
      if (db.exists('payments', { invoiceNumber: paymentData.invoiceNumber })) {
        showToast('El número de factura ya existe', 'error');
        return null;
      }

      const payment = db.insert('payments', {
        clientId: paymentData.clientId,
        serviceId: paymentData.serviceId || null,
        invoiceNumber: paymentData.invoiceNumber.trim(),
        description: paymentData.description.trim(),
        amount: parseFloat(paymentData.amount),
        currency: paymentData.currency || 'USD',
        dueDate: paymentData.dueDate,
        paidDate: paymentData.paidDate || null,
        status: paymentData.status || 'pending',
        paymentMethod: paymentData.paymentMethod || null,
        transactionId: paymentData.transactionId?.trim() || null,
        notes: paymentData.notes?.trim() || null
      });

      showToast('Pago creado exitosamente', 'success');
      return payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      showToast('Error al crear pago', 'error');
      return null;
    }
  }

  update(id, updates) {
    try {
      const count = db.updateById('payments', id, updates);
      if (count > 0) {
        showToast('Pago actualizado exitosamente', 'success');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating payment:', error);
      showToast('Error al actualizar payment', 'error');
      return false;
    }
  }

  delete(id) {
    try {
      const count = db.deleteById('payments', id);
      if (count > 0) {
        showToast('Pago eliminado exitosamente', 'success');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting payment:', error);
      showToast('Error al eliminar pago', 'error');
      return false;
    }
  }

  markAsPaid(id, paidDate = null, paymentMethod = null, transactionId = null) {
    return this.update(id, {
      status: 'paid',
      paidDate: paidDate || new Date().toISOString().split('T')[0],
      paymentMethod,
      transactionId
    });
  }

  checkOverduePayments() {
    const pending = db.select('payments', { status: 'pending' });
    let overdueCount = 0;

    pending.forEach(payment => {
      if (new Date(payment.dueDate) < new Date()) {
        db.updateById('payments', payment.id, { status: 'overdue' });
        overdueCount++;
      }
    });

    return overdueCount;
  }

  getStats() {
    const payments = this.getAll();
    return {
      total: payments.length,
      pending: payments.filter(p => p.status === 'pending').length,
      paid: payments.filter(p => p.status === 'paid').length,
      overdue: payments.filter(p => p.status === 'overdue').length,
      totalPending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
      totalOverdue: payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0)
    };
  }
}

// Exportar instancias
export const domainsService = new DomainsService();
export const hostingService = new HostingService();
export const licensesService = new LicensesService();
export const ticketsService = new TicketsService();
export const paymentsService = new PaymentsService();

export default {
  domains: domainsService,
  hosting: hostingService,
  licenses: licensesService,
  tickets: ticketsService,
  payments: paymentsService
};
