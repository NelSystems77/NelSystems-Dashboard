/**
 * NELSYSTEMS DASHBOARD - MODAL COMPONENT
 * Sistema de modales reutilizable
 */

class ModalManager {
  constructor() {
    this.currentModal = null;
    this.init();
  }

  init() {
    if (!document.getElementById('modal-container')) {
      const container = document.createElement('div');
      container.id = 'modal-container';
      document.body.appendChild(container);
    }
  }

  open(config) {
    this.close();
    const modal = this.createModal(config);
    const container = document.getElementById('modal-container');
    container.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    this.currentModal = modal;
    
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
    return modal;
  }

  createModal(config) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content ${config.size || 'medium'}">
        <div class="modal-header">
          <h2 class="modal-title">${config.title || ''}</h2>
          <button class="modal-close" aria-label="Cerrar">×</button>
        </div>
        <div class="modal-body">${config.content || ''}</div>
        ${config.footer ? `<div class="modal-footer">${config.footer}</div>` : ''}
      </div>
    `;
    modal.querySelector('.modal-overlay').addEventListener('click', () => this.close());
    modal.querySelector('.modal-close').addEventListener('click', () => this.close());
    return modal;
  }

  close() {
    if (this.currentModal) {
      this.currentModal.classList.remove('show');
      setTimeout(() => {
        this.currentModal.remove();
        this.currentModal = null;
      }, 300);
    }
  }

  openFormModal(config) {
    const formHtml = this.generateForm(config.fields);
    const modal = this.open({
      title: config.title,
      size: config.size || 'medium',
      content: `<form id="${config.formId || 'modal-form'}" class="modal-form">${formHtml}</form>`,
      footer: `
        <button type="button" class="btn btn-secondary" data-action="cancel">Cancelar</button>
        <button type="submit" form="${config.formId || 'modal-form'}" class="btn btn-primary">${config.submitText || 'Guardar'}</button>
      `
    });

    const form = modal.querySelector('form');
    if (config.data) {
      Object.keys(config.data).forEach(key => {
        const field = form.querySelector(`[name="${key}"]`);
        if (field) field.value = config.data[key] || '';
      });
    }

    modal.querySelector('[data-action="cancel"]').addEventListener('click', () => this.close());
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      if (config.onSubmit) {
        const result = config.onSubmit(data);
        if (result !== false) this.close();
      }
    });
    return modal;
  }

  generateForm(fields) {
    return fields.map(field => {
      const required = field.required ? 'required' : '';
      const value = field.value || '';

      if (field.type === 'select') {
        return `
          <div class="form-group">
            <label for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>
            <select name="${field.name}" id="${field.name}" ${required}>
              <option value="">Seleccionar...</option>
              ${field.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
            </select>
          </div>
        `;
      } else if (field.type === 'textarea') {
        return `
          <div class="form-group">
            <label for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>
            <textarea name="${field.name}" id="${field.name}" ${required} rows="${field.rows || 4}"></textarea>
          </div>
        `;
      } else {
        return `
          <div class="form-group">
            <label for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>
            <input type="${field.type || 'text'}" name="${field.name}" id="${field.name}" ${required}>
          </div>
        `;
      }
    }).join('');
  }
}

export const modal = new ModalManager();
export default modal;
