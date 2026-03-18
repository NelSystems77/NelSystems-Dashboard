/**
 * NELSYSTEMS DASHBOARD - DOMAINS SERVICE
 * 
 * Servicio para gestión de dominios
 */

import db from '../database/db.js';
import { showToast, daysUntil, isValidDomain } from '../utils/helpers.js';

class DomainsService {
  getAll(filters = {}) {
    let domains = db.select('domains');
    
    if (filters.status) {
      domains = domains.filter(d => d.status === filters.status);
    }
    
    if (filters.clientId) {
      domains = domains.filter(d => d.clientId === filters.clientId);
    }
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      domains = domains.filter(d => 
        d.domain.toLowerCase().includes(search) ||
        (d.registrar && d.registrar.toLowerCase().includes(search))
      );
    }
    
    return domains.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getById(id) {
    return db.selectById('domains', id);
  }

  create(domainData) {
    try {
      const validation = this.validate(domainData);
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return null;
      }

      // Verificar que el dominio no exista
      if (db.exists('domains', { domain: domainData.domain })) {
        showToast('Este dominio ya está registrado', 'error');
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
        price: parseFloat(domainData.price) || null,
        reminderDays: parseInt(domainData.reminderDays) || 30,
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
      const domain = this.getById(id);
      if (!domain) {
        showToast('Dominio no encontrado', 'error');
        return false;
      }

      const validation = this.validate({ ...domain, ...updates });
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return false;
      }

      // Verificar unicidad de dominio si cambió
      if (updates.domain && updates.domain !== domain.domain) {
        if (db.exists('domains', { domain: updates.domain })) {
          showToast('Este dominio ya está registrado', 'error');
          return false;
        }
      }

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
      const domain = this.getById(id);
      if (!domain) {
        showToast('Dominio no encontrado', 'error');
        return false;
      }

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

  getStats() {
    const domains = this.getAll();
    
    return {
      total: domains.length,
      active: domains.filter(d => d.status === 'active').length,
      expired: domains.filter(d => d.status === 'expired').length,
      expiringSoon: this.getExpiringSoon(30).length,
      critical: this.getExpiringSoon(7).length
    };
  }

  getExpiringSoon(days = 30) {
    const domains = this.getAll({ status: 'active' });
    
    return domains.filter(d => {
      const daysLeft = daysUntil(d.expirationDate);
      return daysLeft >= 0 && daysLeft <= days;
    });
  }

  validate(domainData) {
    if (!domainData.domain || domainData.domain.trim().length === 0) {
      return { valid: false, error: 'El dominio es requerido' };
    }

    if (!isValidDomain(domainData.domain)) {
      return { valid: false, error: 'Formato de dominio inválido' };
    }

    if (!domainData.clientId) {
      return { valid: false, error: 'El cliente es requerido' };
    }

    if (!domainData.registrar || domainData.registrar.trim().length === 0) {
      return { valid: false, error: 'El registrador es requerido' };
    }

    if (!domainData.registrationDate) {
      return { valid: false, error: 'La fecha de registro es requerida' };
    }

    if (!domainData.expirationDate) {
      return { valid: false, error: 'La fecha de expiración es requerida' };
    }

    if (new Date(domainData.registrationDate) > new Date(domainData.expirationDate)) {
      return { valid: false, error: 'La fecha de registro no puede ser posterior a la expiración' };
    }

    return { valid: true };
  }
}

export const domainsService = new DomainsService();
export default domainsService;
