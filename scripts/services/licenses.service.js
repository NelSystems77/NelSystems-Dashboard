/**
 * NELSYSTEMS DASHBOARD - LICENSES SERVICE
 * 
 * Servicio para gestión de licencias
 */

import db from '../database/db.js';
import { showToast, daysUntil } from '../utils/helpers.js';

class LicensesService {
  getAll(filters = {}) {
    let licenses = db.select('licenses');
    
    if (filters.status) {
      licenses = licenses.filter(l => l.status === filters.status);
    }
    
    if (filters.clientId) {
      licenses = licenses.filter(l => l.clientId === filters.clientId);
    }
    
    if (filters.type) {
      licenses = licenses.filter(l => l.type === filters.type);
    }
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      licenses = licenses.filter(l => 
        l.name.toLowerCase().includes(search) ||
        l.provider.toLowerCase().includes(search)
      );
    }
    
    return licenses.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getById(id) {
    return db.selectById('licenses', id);
  }

  create(licenseData) {
    try {
      const validation = this.validate(licenseData);
      if (!validation.valid) {
        showToast(validation.error, 'error');
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
      const license = this.getById(id);
      if (!license) {
        showToast('Licencia no encontrada', 'error');
        return false;
      }

      const validation = this.validate({ ...license, ...updates });
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return false;
      }

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
      const license = this.getById(id);
      if (!license) {
        showToast('Licencia no encontrada', 'error');
        return false;
      }

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

  getStats() {
    const licenses = this.getAll();
    
    return {
      total: licenses.length,
      active: licenses.filter(l => l.status === 'active').length,
      expired: licenses.filter(l => l.status === 'expired').length,
      cancelled: licenses.filter(l => l.status === 'cancelled').length,
      byType: this.getByType(),
      totalSeats: licenses.reduce((sum, l) => sum + (l.seats || 0), 0)
    };
  }

  getByType() {
    const licenses = this.getAll({ status: 'active' });
    const byType = {};
    
    licenses.forEach(license => {
      byType[license.type] = (byType[license.type] || 0) + 1;
    });
    
    return byType;
  }

  getExpiringSoon(days = 30) {
    const licenses = this.getAll({ status: 'active' });
    
    return licenses.filter(l => {
      if (!l.renewalDate) return false;
      const daysLeft = daysUntil(l.renewalDate);
      return daysLeft >= 0 && daysLeft <= days;
    });
  }

  validate(licenseData) {
    if (!licenseData.clientId) {
      return { valid: false, error: 'El cliente es requerido' };
    }

    if (!licenseData.name || licenseData.name.trim().length === 0) {
      return { valid: false, error: 'El nombre es requerido' };
    }

    if (!licenseData.type) {
      return { valid: false, error: 'El tipo de licencia es requerido' };
    }

    if (!licenseData.provider || licenseData.provider.trim().length === 0) {
      return { valid: false, error: 'El proveedor es requerido' };
    }

    if (!licenseData.purchaseDate) {
      return { valid: false, error: 'La fecha de compra es requerida' };
    }

    if (!licenseData.cost || licenseData.cost < 0) {
      return { valid: false, error: 'El costo debe ser mayor a 0' };
    }

    if (!licenseData.billingCycle) {
      return { valid: false, error: 'El ciclo de facturación es requerido' };
    }

    if (licenseData.seats && licenseData.seats < 1) {
      return { valid: false, error: 'El número de seats debe ser mayor a 0' };
    }

    return { valid: true };
  }
}

export const licensesService = new LicensesService();
export default licensesService;
