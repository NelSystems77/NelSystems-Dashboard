/**
 * NELSYSTEMS DASHBOARD - MODAL COMPONENT
 * 
 * Componente reutilizable para modales/diálogos
 * Soporta formularios, confirmaciones y contenido personalizado
 */

class Modal {
  constructor() {
    this.modalElement = null;
    this.isOpen = false;
  }

  /**
   * Crea un modal con contenido personalizado
   * @param {Object} options - Opciones del modal
   * @param {string} options.title - Título del modal
   * @param {string} options.content - Contenido HTML del modal
   * @param {string} options.size - Tamaño: 'sm', 'md', 'lg', 'xl'
   * @param {Array} options.actions - Array de botones [{text, class, onClick}]
   * @param {boolean} options.closeOnOverlay - Cerrar al hacer click fuera
   */
  create({ title, content, size = 'md', actions = [], closeOnOverlay = true }) {
    this.close(); // Cerrar modal anterior si existe

    const modalHTML = `
      <div class="modal-overlay" data-close-on-click="${closeOnOverlay}">
        <div class="modal-container modal-${size}">
          <div class="modal-header">
            <h2 class="modal-title">${title}</h2>
            <button class="modal-close" aria-label="Cerrar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            ${content}
          </div>
          ${actions.length > 0 ? `
            <div class="modal-footer">
              ${actions.map((action, index) => `
                <button 
                  class="btn ${action.class || 'btn-secondary'}" 
                  data-action-index="${index}"
                  ${action.disabled ? 'disabled' : ''}
                >
                  ${action.text}
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Agregar al DOM
    const modalWrapper = document.createElement('div');
    modalWrapper.innerHTML = modalHTML;
    this.modalElement = modalWrapper.firstElementChild;
    document.body.appendChild(this.modalElement);

    // Event listeners
    this.setupEventListeners(actions, closeOnOverlay);

    // Mostrar con animación
    setTimeout(() => {
      this.modalElement.classList.add('modal-show');
      this.isOpen = true;
    }, 10);

    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';

    return this;
  }

  /**
   * Crea un modal con formulario
   * @param {Object} options - Opciones del modal
   * @param {string} options.title - Título
   * @param {Array} options.fields - Array de campos del formulario
   * @param {Object} options.data - Datos iniciales (para edición)
   * @param {Function} options.onSubmit - Callback al enviar
   * @param {Function} options.onCancel - Callback al cancelar
   */
  createForm({ title, fields, data = {}, onSubmit, onCancel }) {
    const formId = `modal-form-${Date.now()}`;
    
    const formContent = `
      <form id="${formId}" class="modal-form">
        ${fields.map(field => this.renderField(field, data)).join('')}
      </form>
    `;

    const actions = [
      {
        text: 'Cancelar',
        class: 'btn-secondary',
        onClick: () => {
          this.close();
          if (onCancel) onCancel();
        }
      },
      {
        text: data.id ? 'Actualizar' : 'Crear',
        class: 'btn-primary',
        onClick: () => {
          const form = document.getElementById(formId);
          if (form.checkValidity()) {
            const formData = new FormData(form);
            const values = Object.fromEntries(formData.entries());
            
            if (onSubmit) {
              const result = onSubmit(values);
              // Solo cerrar si onSubmit no retorna false
              if (result !== false) {
                this.close();
              }
            } else {
              this.close();
            }
          } else {
            form.reportValidity();
          }
        }
      }
    ];

    return this.create({
      title,
      content: formContent,
      size: 'md',
      actions,
      closeOnOverlay: false
    });
  }

  /**
   * Renderiza un campo de formulario
   */
  renderField(field, data) {
    const {
      name,
      label,
      type = 'text',
      required = false,
      placeholder = '',
      options = [], // Para select
      rows = 3, // Para textarea
      value = data[name] || ''
    } = field;

    const fieldId = `field-${name}`;
    const requiredAttr = required ? 'required' : '';
    const requiredMark = required ? '<span class="text-error">*</span>' : '';

    let inputHTML = '';

    switch (type) {
      case 'textarea':
        inputHTML = `
          <textarea 
            id="${fieldId}" 
            name="${name}" 
            rows="${rows}"
            placeholder="${placeholder}"
            class="form-input"
            ${requiredAttr}
          >${value}</textarea>
        `;
        break;

      case 'select':
        inputHTML = `
          <select 
            id="${fieldId}" 
            name="${name}" 
            class="form-input"
            ${requiredAttr}
          >
            <option value="">Seleccionar...</option>
            ${options.map(opt => {
              const optValue = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              const selected = value === optValue ? 'selected' : '';
              return `<option value="${optValue}" ${selected}>${optLabel}</option>`;
            }).join('')}
          </select>
        `;
        break;

      case 'checkbox':
        const checked = value ? 'checked' : '';
        inputHTML = `
          <div class="form-checkbox">
            <input 
              type="checkbox" 
              id="${fieldId}" 
              name="${name}" 
              ${checked}
            >
            <label for="${fieldId}">${label} ${requiredMark}</label>
          </div>
        `;
        return inputHTML; // Checkbox tiene su propio label

      default:
        inputHTML = `
          <input 
            type="${type}" 
            id="${fieldId}" 
            name="${name}" 
            value="${value}"
            placeholder="${placeholder}"
            class="form-input"
            ${requiredAttr}
          >
        `;
    }

    return `
      <div class="form-group">
        <label for="${fieldId}" class="form-label">
          ${label} ${requiredMark}
        </label>
        ${inputHTML}
      </div>
    `;
  }

  /**
   * Crea un modal de confirmación
   */
  confirm({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, onCancel }) {
    const actions = [
      {
        text: cancelText,
        class: 'btn-secondary',
        onClick: () => {
          this.close();
          if (onCancel) onCancel();
        }
      },
      {
        text: confirmText,
        class: 'btn-primary',
        onClick: () => {
          this.close();
          if (onConfirm) onConfirm();
        }
      }
    ];

    return this.create({
      title,
      content: `<p style="margin: 0; color: var(--color-text-secondary);">${message}</p>`,
      size: 'sm',
      actions,
      closeOnOverlay: false
    });
  }

  /**
   * Crea un modal de alerta
   */
  alert({ title, message, buttonText = 'Entendido', onClose }) {
    const actions = [
      {
        text: buttonText,
        class: 'btn-primary',
        onClick: () => {
          this.close();
          if (onClose) onClose();
        }
      }
    ];

    return this.create({
      title,
      content: `<p style="margin: 0; color: var(--color-text-secondary);">${message}</p>`,
      size: 'sm',
      actions,
      closeOnOverlay: true
    });
  }

  /**
   * Configura event listeners
   */
  setupEventListeners(actions, closeOnOverlay) {
    if (!this.modalElement) return;

    // Botón de cerrar (X)
    const closeBtn = this.modalElement.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Click en overlay
    if (closeOnOverlay) {
      const overlay = this.modalElement.querySelector('.modal-overlay');
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.close();
        }
      });
    }

    // Botones de acción
    actions.forEach((action, index) => {
      const btn = this.modalElement.querySelector(`[data-action-index="${index}"]`);
      if (btn && action.onClick) {
        btn.addEventListener('click', action.onClick);
      }
    });

    // ESC para cerrar
    this.escapeHandler = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);
  }

  /**
   * Cierra el modal
   */
  close() {
    if (!this.modalElement) return;

    // Remover animación
    this.modalElement.classList.remove('modal-show');

    // Remover del DOM después de la animación
    setTimeout(() => {
      if (this.modalElement && this.modalElement.parentNode) {
        this.modalElement.parentNode.removeChild(this.modalElement);
      }
      this.modalElement = null;
      this.isOpen = false;

      // Restaurar scroll del body
      document.body.style.overflow = '';

      // Remover listener de ESC
      if (this.escapeHandler) {
        document.removeEventListener('keydown', this.escapeHandler);
        this.escapeHandler = null;
      }
    }, 300);
  }

  /**
   * Actualiza el contenido del modal
   */
  updateContent(content) {
    if (!this.modalElement) return;

    const body = this.modalElement.querySelector('.modal-body');
    if (body) {
      body.innerHTML = content;
    }
  }

  /**
   * Actualiza el título del modal
   */
  updateTitle(title) {
    if (!this.modalElement) return;

    const titleEl = this.modalElement.querySelector('.modal-title');
    if (titleEl) {
      titleEl.textContent = title;
    }
  }

  /**
   * Deshabilita/habilita botones de acción
   */
  setActionsDisabled(disabled) {
    if (!this.modalElement) return;

    const buttons = this.modalElement.querySelectorAll('.modal-footer .btn');
    buttons.forEach(btn => {
      btn.disabled = disabled;
    });
  }
}

// Exportar instancia singleton
export const modal = new Modal();
export default modal;
