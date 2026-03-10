/**
 * NELSYSTEMS DASHBOARD - PROJECTS SERVICE
 */

import db from '../database/db.js';
import { showToast } from '../utils/helpers.js';

class ProjectsService {
  getAll(filters = {}) {
    let projects = db.select('projects');
    
    if (filters.status) projects = projects.filter(p => p.status === filters.status);
    if (filters.clientId) projects = projects.filter(p => p.clientId === filters.clientId);
    if (filters.priority) projects = projects.filter(p => p.priority === filters.priority);
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      projects = projects.filter(p => 
        p.name.toLowerCase().includes(search) ||
        (p.description && p.description.toLowerCase().includes(search))
      );
    }
    
    return projects.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getById(id) {
    return db.selectById('projects', id);
  }

  create(projectData) {
    try {
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
        budget: projectData.budget ? parseFloat(projectData.budget) : null,
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

  update(id, updates) {
    try {
      const project = this.getById(id);
      if (!project) {
        showToast('Proyecto no encontrado', 'error');
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

  delete(id) {
    try {
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

  getStats() {
    const projects = this.getAll();
    return {
      total: projects.length,
      planning: projects.filter(p => p.status === 'planning').length,
      in_progress: projects.filter(p => p.status === 'in_progress').length,
      testing: projects.filter(p => p.status === 'testing').length,
      deployed: projects.filter(p => p.status === 'deployed').length,
      maintenance: projects.filter(p => p.status === 'maintenance').length,
      cancelled: projects.filter(p => p.status === 'cancelled').length
    };
  }

  validate(projectData) {
    if (!projectData.clientId) {
      return { valid: false, error: 'El cliente es requerido' };
    }
    if (!projectData.name || projectData.name.trim().length === 0) {
      return { valid: false, error: 'El nombre es requerido' };
    }
    return { valid: true };
  }
}

export const projectsService = new ProjectsService();
export default projectsService;
