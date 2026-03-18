/**
 * NELSYSTEMS DASHBOARD - TICKETS SERVICE
 * 
 * Servicio para gestión de tickets/solicitudes
 */

import db from '../database/db.js';
import { showToast } from '../utils/helpers.js';

class TicketsService {
  getAll(filters = {}) {
    let tickets = db.select('tickets');
    
    if (filters.status) {
      tickets = tickets.filter(t => t.status === filters.status);
    }
    
    if (filters.clientId) {
      tickets = tickets.filter(t => t.clientId === filters.clientId);
    }
    
    if (filters.type) {
      tickets = tickets.filter(t => t.type === filters.type);
    }
    
    if (filters.priority) {
      tickets = tickets.filter(t => t.priority === filters.priority);
    }
    
    if (filters.assignedTo) {
      tickets = tickets.filter(t => t.assignedTo === filters.assignedTo);
    }
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      tickets = tickets.filter(t => 
        t.title.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search)
      );
    }
    
    return tickets.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getById(id) {
    return db.selectById('tickets', id);
  }

  create(ticketData) {
    try {
      const validation = this.validate(ticketData);
      if (!validation.valid) {
        showToast(validation.error, 'error');
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
      const ticket = this.getById(id);
      if (!ticket) {
        showToast('Ticket no encontrado', 'error');
        return false;
      }

      const validation = this.validate({ ...ticket, ...updates });
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return false;
      }

      // Actualizar timestamps automáticamente
      if (updates.status === 'resolved' && !ticket.resolvedAt) {
        updates.resolvedAt = new Date().toISOString();
      }
      if (updates.status === 'closed' && !ticket.closedAt) {
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
      const ticket = this.getById(id);
      if (!ticket) {
        showToast('Ticket no encontrado', 'error');
        return false;
      }

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

  changeStatus(id, status) {
    return this.update(id, { status });
  }

  assignTo(id, userId) {
    return this.update(id, { assignedTo: userId });
  }

  getStats() {
    const tickets = this.getAll();
    
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      pendingClient: tickets.filter(t => t.status === 'pending_client').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length,
      urgent: tickets.filter(t => t.priority === 'urgent' && t.status !== 'closed').length,
      byType: this.getByType()
    };
  }

  getByType() {
    const tickets = this.getAll();
    const byType = {};
    
    tickets.forEach(ticket => {
      byType[ticket.type] = (byType[ticket.type] || 0) + 1;
    });
    
    return byType;
  }

  getMyTickets(userId) {
    return this.getAll({ assignedTo: userId, status: (t) => t.status !== 'closed' });
  }

  getUrgent() {
    return this.getAll().filter(t => 
      t.priority === 'urgent' && 
      t.status !== 'closed' && 
      t.status !== 'resolved'
    );
  }

  validate(ticketData) {
    if (!ticketData.clientId) {
      return { valid: false, error: 'El cliente es requerido' };
    }

    if (!ticketData.title || ticketData.title.trim().length === 0) {
      return { valid: false, error: 'El título es requerido' };
    }

    if (!ticketData.description || ticketData.description.trim().length === 0) {
      return { valid: false, error: 'La descripción es requerida' };
    }

    if (!ticketData.type) {
      return { valid: false, error: 'El tipo de ticket es requerido' };
    }

    if (ticketData.estimatedHours && ticketData.estimatedHours < 0) {
      return { valid: false, error: 'Las horas estimadas no pueden ser negativas' };
    }

    if (ticketData.actualHours && ticketData.actualHours < 0) {
      return { valid: false, error: 'Las horas reales no pueden ser negativas' };
    }

    return { valid: true };
  }
}

export const ticketsService = new TicketsService();
export default ticketsService;
