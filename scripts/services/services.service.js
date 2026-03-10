/**
 * NELSYSTEMS DASHBOARD - SERVICES SERVICE
 * 
 * Servicio para gestión de servicios SaaS
 */

import db from '../database/db.js';
import { isUpcoming, daysUntil, addMonths, addYears, showToast } from '../utils/helpers.js';

class ServicesService {
  /**
   * Obtiene todos los servicios
   */
  getAll(filters = {}) {
    let services = db.select('services');
    
    if (filters.status) {
      services = services.filter(s => s.status === filters.status);
    }
    
    if (filters.type) {
      services = services.filter(s => s.type === filters.type);
    }
    
    if (filters.clientId) {
      services = services.filter(s => s.clientId === filters.clientId);
    }
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      services = services.filter(s => 
        s.name.toLowerCase().includes(search) ||
        (s.description && s.description.toLowerCase().includes(search))
      );
    }
    
    return services.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /**
   * Obtiene un servicio por ID
   */
  getById(id) {
    return db.selectById('services', id);
  }

  /**
   * Crea un nuevo servicio
   */
  create(serviceData) {
    try {
      const validation = this.validate(serviceData);
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return null;
      }

      const service = db.insert('services', {
        clientId: serviceData.clientId,
        projectId: serviceData.projectId || null,
        name: serviceData.name.trim(),
        type: serviceData.type,
        description: serviceData.description?.trim() || null,
        provider: serviceData.provider?.trim() || null,
        startDate: serviceData.startDate,
        endDate: serviceData.endDate || this.calculateEndDate(serviceData.startDate, serviceData.billingCycle),
        billingCycle: serviceData.billingCycle,
        amount: parseFloat(serviceData.amount),
        currency: serviceData.currency || 'USD',
        status: serviceData.status || 'active',
        autoRenew: serviceData.autoRenew !== false,
        notes: serviceData.notes?.trim() || null
      });

      // Crear recordatorios automáticos
      if (service.endDate && service.autoRenew) {
        this.createReminders(service);
      }

      showToast('Servicio creado exitosamente', 'success');
      return service;
    } catch (error) {
      console.error('Error creating service:', error);
      showToast('Error al crear servicio', 'error');
      return null;
    }
  }

  /**
   * Actualiza un servicio
   */
  update(id, updates) {
    try {
      const service = this.getById(id);
      if (!service) {
        showToast('Servicio no encontrado', 'error');
        return false;
      }

      const validation = this.validate({ ...service, ...updates });
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return false;
      }

      const count = db.updateById('services', id, {
        ...updates,
        amount: updates.amount ? parseFloat(updates.amount) : service.amount
      });

      if (count > 0) {
        showToast('Servicio actualizado exitosamente', 'success');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error updating service:', error);
      showToast('Error al actualizar servicio', 'error');
      return false;
    }
  }

  /**
   * Elimina un servicio
   */
  delete(id) {
    try {
      const service = this.getById(id);
      if (!service) {
        showToast('Servicio no encontrado', 'error');
        return false;
      }

      const count = db.deleteById('services', id);
      
      if (count > 0) {
        // Eliminar recordatorios asociados
        db.delete('notifications', { relatedType: 'service', relatedId: id });
        showToast('Servicio eliminado exitosamente', 'success');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error deleting service:', error);
      showToast('Error al eliminar servicio', 'error');
      return false;
    }
  }

  /**
   * Calcula fecha de fin según ciclo de facturación
   */
  calculateEndDate(startDate, billingCycle) {
    const start = new Date(startDate);
    
    switch (billingCycle) {
      case 'monthly':
        return addMonths(start, 1).toISOString().split('T')[0];
      case 'quarterly':
        return addMonths(start, 3).toISOString().split('T')[0];
      case 'biannual':
        return addMonths(start, 6).toISOString().split('T')[0];
      case 'annual':
        return addYears(start, 1).toISOString().split('T')[0];
      default:
        return null;
    }
  }

  /**
   * Crea recordatorios automáticos para un servicio
   */
  createReminders(service) {
    const settings = db.selectOne('settings', { key: 'notifications' });
    const daysBefore = settings?.value?.email?.daysBefore || [30, 15, 7, 3, 1];
    
    const client = db.selectById('clients', service.clientId);
    if (!client) return;

    daysBefore.forEach(days => {
      const scheduledDate = new Date(service.endDate);
      scheduledDate.setDate(scheduledDate.getDate() - days);

      db.insert('notifications', {
        clientId: service.clientId,
        relatedType: 'service',
        relatedId: service.id,
        type: 'renewal',
        title: `Renovación de ${service.name}`,
        message: `El servicio ${service.name} vence en ${days} día(s). Fecha de vencimiento: ${service.endDate}`,
        channel: 'email',
        scheduledFor: scheduledDate.toISOString(),
        status: 'pending'
      });
    });
  }

  /**
   * Renueva un servicio
   */
  renew(id, newEndDate = null) {
    const service = this.getById(id);
    if (!service) {
      showToast('Servicio no encontrado', 'error');
      return false;
    }

    const endDate = newEndDate || this.calculateEndDate(service.endDate, service.billingCycle);
    
    const success = this.update(id, {
      endDate,
      status: 'active'
    });

    if (success && service.autoRenew) {
      this.createReminders({ ...service, endDate });
    }

    return success;
  }

  /**
   * Marca servicios vencidos
   */
  checkExpiredServices() {
    const services = db.select('services', { status: 'active' });
    let expiredCount = 0;

    services.forEach(service => {
      if (service.endDate && new Date(service.endDate) < new Date()) {
        db.updateById('services', service.id, { status: 'expired' });
        expiredCount++;
      }
    });

    return expiredCount;
  }

  /**
   * Obtiene estadísticas de servicios
   */
  getStats() {
    const services = this.getAll();
    const byType = {};
    const byStatus = {};

    services.forEach(service => {
      byType[service.type] = (byType[service.type] || 0) + 1;
      byStatus[service.status] = (byStatus[service.status] || 0) + 1;
    });

    return {
      total: services.length,
      byType,
      byStatus,
      active: services.filter(s => s.status === 'active').length,
      expired: services.filter(s => s.status === 'expired').length
    };
  }

  /**
   * Valida datos de servicio
   */
  validate(serviceData) {
    if (!serviceData.clientId) {
      return { valid: false, error: 'El cliente es requerido' };
    }

    if (!serviceData.name || serviceData.name.trim().length === 0) {
      return { valid: false, error: 'El nombre es requerido' };
    }

    if (!serviceData.type) {
      return { valid: false, error: 'El tipo de servicio es requerido' };
    }

    if (!serviceData.startDate) {
      return { valid: false, error: 'La fecha de inicio es requerida' };
    }

    if (!serviceData.billingCycle) {
      return { valid: false, error: 'El ciclo de facturación es requerido' };
    }

    if (!serviceData.amount || parseFloat(serviceData.amount) <= 0) {
      return { valid: false, error: 'El monto debe ser mayor a 0' };
    }

    return { valid: true };
  }
}

export const servicesService = new ServicesService();
export default servicesService;
