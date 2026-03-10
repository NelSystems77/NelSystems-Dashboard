/**
 * NELSYSTEMS DASHBOARD - CLIENTS SERVICE
 * 
 * Servicio para gestión de clientes
 */

import db from '../database/db.js';
import { isValidEmail, isValidPhone, showToast } from '../utils/helpers.js';

class ClientsService {
  /**
   * Obtiene todos los clientes
   */
  getAll(filters = {}) {
    let clients = db.select('clients');
    
    // Aplicar filtros
    if (filters.status) {
      clients = clients.filter(c => c.status === filters.status);
    }
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      clients = clients.filter(c => 
        c.name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        (c.company && c.company.toLowerCase().includes(search))
      );
    }
    
    return clients.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /**
   * Obtiene un cliente por ID
   */
  getById(id) {
    return db.selectById('clients', id);
  }

  /**
   * Crea un nuevo cliente
   */
  create(clientData) {
    try {
      // Validaciones
      const validation = this.validate(clientData);
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return null;
      }

      // Verificar email único
      if (db.exists('clients', { email: clientData.email })) {
        showToast('Ya existe un cliente con ese email', 'error');
        return null;
      }

      const client = db.insert('clients', {
        name: clientData.name.trim(),
        company: clientData.company?.trim() || null,
        email: clientData.email.toLowerCase().trim(),
        phone: clientData.phone?.trim() || null,
        address: clientData.address?.trim() || null,
        taxId: clientData.taxId?.trim() || null,
        website: clientData.website?.trim() || null,
        notes: clientData.notes?.trim() || null,
        status: clientData.status || 'active'
      });

      showToast('Cliente creado exitosamente', 'success');
      return client;
    } catch (error) {
      console.error('Error creating client:', error);
      showToast('Error al crear cliente', 'error');
      return null;
    }
  }

  /**
   * Actualiza un cliente
   */
  update(id, updates) {
    try {
      const client = this.getById(id);
      if (!client) {
        showToast('Cliente no encontrado', 'error');
        return false;
      }

      // Validaciones
      const validation = this.validate({ ...client, ...updates });
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return false;
      }

      // Verificar email único (si cambió)
      if (updates.email && updates.email !== client.email) {
        if (db.exists('clients', { email: updates.email })) {
          showToast('Ya existe un cliente con ese email', 'error');
          return false;
        }
      }

      const count = db.updateById('clients', id, {
        ...updates,
        email: updates.email?.toLowerCase().trim() || client.email
      });

      if (count > 0) {
        showToast('Cliente actualizado exitosamente', 'success');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error updating client:', error);
      showToast('Error al actualizar cliente', 'error');
      return false;
    }
  }

  /**
   * Elimina un cliente
   */
  delete(id) {
    try {
      const client = this.getById(id);
      if (!client) {
        showToast('Cliente no encontrado', 'error');
        return false;
      }

      // Verificar si tiene servicios activos
      const activeServices = db.select('services', { 
        clientId: id,
        status: 'active'
      });

      if (activeServices.length > 0) {
        const confirmDelete = confirm(
          `Este cliente tiene ${activeServices.length} servicio(s) activo(s). ¿Desea eliminarlo de todas formas?`
        );
        
        if (!confirmDelete) return false;
      }

      const count = db.deleteById('clients', id);
      
      if (count > 0) {
        showToast('Cliente eliminado exitosamente', 'success');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error deleting client:', error);
      showToast('Error al eliminar cliente', 'error');
      return false;
    }
  }

  /**
   * Cambia el estado de un cliente
   */
  changeStatus(id, status) {
    return this.update(id, { status });
  }

  /**
   * Obtiene estadísticas de clientes
   */
  getStats() {
    const clients = this.getAll();
    
    return {
      total: clients.length,
      active: clients.filter(c => c.status === 'active').length,
      inactive: clients.filter(c => c.status === 'inactive').length,
      suspended: clients.filter(c => c.status === 'suspended').length
    };
  }

  /**
   * Obtiene servicios de un cliente
   */
  getClientServices(clientId) {
    return db.select('services', { clientId });
  }

  /**
   * Obtiene proyectos de un cliente
   */
  getClientProjects(clientId) {
    return db.select('projects', { clientId });
  }

  /**
   * Obtiene pagos de un cliente
   */
  getClientPayments(clientId) {
    return db.select('payments', { clientId });
  }

  /**
   * Obtiene el historial completo de un cliente
   */
  getClientHistory(clientId) {
    return {
      services: this.getClientServices(clientId),
      projects: this.getClientProjects(clientId),
      payments: this.getClientPayments(clientId),
      tickets: db.select('tickets', { clientId }),
      domains: db.select('domains', { clientId }),
      hosting: db.select('hosting', { clientId }),
      licenses: db.select('licenses', { clientId })
    };
  }

  /**
   * Valida datos de cliente
   */
  validate(clientData) {
    if (!clientData.name || clientData.name.trim().length === 0) {
      return { valid: false, error: 'El nombre es requerido' };
    }

    if (!clientData.email || clientData.email.trim().length === 0) {
      return { valid: false, error: 'El email es requerido' };
    }

    if (!isValidEmail(clientData.email)) {
      return { valid: false, error: 'Formato de email inválido' };
    }

    if (clientData.phone && !isValidPhone(clientData.phone)) {
      return { valid: false, error: 'Formato de teléfono inválido' };
    }

    return { valid: true };
  }
}

export const clientsService = new ClientsService();
export default clientsService;
