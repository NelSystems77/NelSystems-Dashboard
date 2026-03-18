/**
 * NELSYSTEMS DASHBOARD - PROJECTS SERVICE
 * 
 * Servicio para gestión de proyectos de desarrollo
 */

import db from '../database/db.js';
import { showToast, formatDate } from '../utils/helpers.js';

class ProjectsService {
  /**
   * Obtiene todos los proyectos
   */
  getAll(filters = {}) {
    let projects = db.select('projects');
    
    // Aplicar filtros
    if (filters.status) {
      projects = projects.filter(p => p.status === filters.status);
    }
    
    if (filters.clientId) {
      projects = projects.filter(p => p.clientId === filters.clientId);
    }
    
    if (filters.priority) {
      projects = projects.filter(p => p.priority === filters.priority);
    }
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      projects = projects.filter(p => 
        p.name.toLowerCase().includes(search) ||
        (p.description && p.description.toLowerCase().includes(search))
      );
    }
    
    return projects.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /**
   * Obtiene un proyecto por ID
   */
  getById(id) {
    return db.selectById('projects', id);
  }

  /**
   * Crea un nuevo proyecto
   */
  create(projectData) {
    try {
      // Validaciones
      const validation = this.validate(projectData);
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return null;
      }

      const project = db.insert('projects', {
        clientId: projectData.clientId,
        name: projectData.name.trim(),
        description: projectData.description?.trim() || null,
        status: projectData.status || 'planning',
        priority: projectData.priority || 'medium',
        startDate: projectData.startDate || null,
        endDate: projectData.endDate || null,
        deliveryDate: projectData.deliveryDate || null,
        budget: projectData.budget || null,
        responsible: projectData.responsible?.trim() || null,
        repository: projectData.repository?.trim() || null,
        productionUrl: projectData.productionUrl?.trim() || null,
        stagingUrl: projectData.stagingUrl?.trim() || null,
        notes: projectData.notes?.trim() || null
      });

      showToast('Proyecto creado exitosamente', 'success');
      return project;
    } catch (error) {
      console.error('Error creating project:', error);
      showToast('Error al crear proyecto', 'error');
      return null;
    }
  }

  /**
   * Actualiza un proyecto
   */
  update(id, updates) {
    try {
      const project = this.getById(id);
      if (!project) {
        showToast('Proyecto no encontrado', 'error');
        return false;
      }

      // Validaciones
      const validation = this.validate({ ...project, ...updates });
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return false;
      }

      const count = db.updateById('projects', id, updates);

      if (count > 0) {
        showToast('Proyecto actualizado exitosamente', 'success');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error updating project:', error);
      showToast('Error al actualizar proyecto', 'error');
      return false;
    }
  }

  /**
   * Elimina un proyecto
   */
  delete(id) {
    try {
      const project = this.getById(id);
      if (!project) {
        showToast('Proyecto no encontrado', 'error');
        return false;
      }

      // Verificar si tiene servicios asociados
      const services = db.select('services', { projectId: id });
      if (services.length > 0) {
        const confirmDelete = confirm(
          `Este proyecto tiene ${services.length} servicio(s) asociado(s). ¿Desea eliminarlo de todas formas?`
        );
        
        if (!confirmDelete) return false;
      }

      const count = db.deleteById('projects', id);
      
      if (count > 0) {
        showToast('Proyecto eliminado exitosamente', 'success');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error deleting project:', error);
      showToast('Error al eliminar proyecto', 'error');
      return false;
    }
  }

  /**
   * Cambia el estado de un proyecto
   */
  changeStatus(id, status) {
    return this.update(id, { status });
  }

  /**
   * Cambia la prioridad de un proyecto
   */
  changePriority(id, priority) {
    return this.update(id, { priority });
  }

  /**
   * Obtiene estadísticas de proyectos
   */
  getStats() {
    const projects = this.getAll();
    
    return {
      total: projects.length,
      planning: projects.filter(p => p.status === 'planning').length,
      inProgress: projects.filter(p => p.status === 'in_progress').length,
      testing: projects.filter(p => p.status === 'testing').length,
      deployed: projects.filter(p => p.status === 'deployed').length,
      maintenance: projects.filter(p => p.status === 'maintenance').length,
      cancelled: projects.filter(p => p.status === 'cancelled').length,
      highPriority: projects.filter(p => p.priority === 'high' || p.priority === 'critical').length
    };
  }

  /**
   * Obtiene proyectos de un cliente
   */
  getByClient(clientId) {
    return this.getAll({ clientId });
  }

  /**
   * Obtiene proyectos activos (en progreso o testing)
   */
  getActive() {
    return this.getAll().filter(p => 
      p.status === 'in_progress' || p.status === 'testing'
    );
  }

  /**
   * Obtiene proyectos vencidos o próximos a vencer
   */
  getUpcoming(days = 7) {
    const projects = this.getAll();
    const now = new Date();
    
    return projects.filter(p => {
      if (!p.deliveryDate) return false;
      
      const deliveryDate = new Date(p.deliveryDate);
      const daysUntil = Math.ceil((deliveryDate - now) / (1000 * 60 * 60 * 24));
      
      return daysUntil >= 0 && daysUntil <= days;
    });
  }

  /**
   * Valida datos de proyecto
   */
  validate(projectData) {
    if (!projectData.name || projectData.name.trim().length === 0) {
      return { valid: false, error: 'El nombre es requerido' };
    }

    if (!projectData.clientId) {
      return { valid: false, error: 'El cliente es requerido' };
    }

    // Validar que el cliente exista
    const client = db.selectById('clients', projectData.clientId);
    if (!client) {
      return { valid: false, error: 'Cliente no encontrado' };
    }

    // Validar fechas
    if (projectData.startDate && projectData.endDate) {
      if (new Date(projectData.startDate) > new Date(projectData.endDate)) {
        return { valid: false, error: 'La fecha de inicio no puede ser mayor a la fecha de fin' };
      }
    }

    // Validar budget
    if (projectData.budget && projectData.budget < 0) {
      return { valid: false, error: 'El presupuesto no puede ser negativo' };
    }

    return { valid: true };
  }
}

export const projectsService = new ProjectsService();
export default projectsService;
