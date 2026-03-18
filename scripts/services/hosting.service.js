/**
 * NELSYSTEMS DASHBOARD - HOSTING SERVICE
 * 
 * Servicio para gestión de hosting
 */

import db from '../database/db.js';
import { showToast, daysUntil } from '../utils/helpers.js';

class HostingService {
  getAll(filters = {}) {
    let hosting = db.select('hosting');
    
    if (filters.status) {
      hosting = hosting.filter(h => h.status === filters.status);
    }
    
    if (filters.clientId) {
      hosting = hosting.filter(h => h.clientId === filters.clientId);
    }
    
    if (filters.provider) {
      hosting = hosting.filter(h => h.provider === filters.provider);
    }
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      hosting = hosting.filter(h => 
        h.provider.toLowerCase().includes(search) ||
        h.plan.toLowerCase().includes(search) ||
        (h.server && h.server.toLowerCase().includes(search))
      );
    }
    
    return hosting.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getById(id) {
    return db.selectById('hosting', id);
  }

  create(hostingData) {
    try {
      const validation = this.validate(hostingData);
      if (!validation.valid) {
        showToast(validation.error, 'error');
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
      const hosting = this.getById(id);
      if (!hosting) {
        showToast('Hosting no encontrado', 'error');
        return false;
      }

      const validation = this.validate({ ...hosting, ...updates });
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return false;
      }

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
      const hosting = this.getById(id);
      if (!hosting) {
        showToast('Hosting no encontrado', 'error');
        return false;
      }

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

  getStats() {
    const hosting = this.getAll();
    
    return {
      total: hosting.length,
      active: hosting.filter(h => h.status === 'active').length,
      suspended: hosting.filter(h => h.status === 'suspended').length,
      cancelled: hosting.filter(h => h.status === 'cancelled').length,
      renewingSoon: this.getRenewingSoon(30).length
    };
  }

  getRenewingSoon(days = 30) {
    const hosting = this.getAll({ status: 'active' });
    
    return hosting.filter(h => {
      const daysLeft = daysUntil(h.renewalDate);
      return daysLeft >= 0 && daysLeft <= days;
    });
  }

  validate(hostingData) {
    if (!hostingData.clientId) {
      return { valid: false, error: 'El cliente es requerido' };
    }

    if (!hostingData.provider || hostingData.provider.trim().length === 0) {
      return { valid: false, error: 'El proveedor es requerido' };
    }

    if (!hostingData.plan || hostingData.plan.trim().length === 0) {
      return { valid: false, error: 'El plan es requerido' };
    }

    if (!hostingData.startDate) {
      return { valid: false, error: 'La fecha de inicio es requerida' };
    }

    if (!hostingData.renewalDate) {
      return { valid: false, error: 'La fecha de renovación es requerida' };
    }

    if (!hostingData.cost || hostingData.cost < 0) {
      return { valid: false, error: 'El costo debe ser mayor a 0' };
    }

    if (!hostingData.billingCycle) {
      return { valid: false, error: 'El ciclo de facturación es requerido' };
    }

    return { valid: true };
  }
}

export const hostingService = new HostingService();
export default hostingService;
