/**
 * NELSYSTEMS DASHBOARD - HELPER UTILITIES
 * 
 * Funciones de utilidad reutilizables en toda la aplicación
 */

// ==================== FORMATEO ====================

/**
 * Formatea una cantidad como moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de moneda (USD, EUR, etc.)
 * @returns {string} Cantidad formateada
 */
export function formatCurrency(amount, currency = 'USD') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return formatter.format(amount);
}

/**
 * Formatea una fecha
 * @param {string|Date} date - Fecha a formatear
 * @param {string} format - Formato: 'short', 'medium', 'long', 'full'
 * @returns {string} Fecha formateada
 */
export function formatDate(date, format = 'short') {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  const options = {
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  };

  return dateObj.toLocaleDateString('es-ES', options[format] || options.short);
}

/**
 * Formatea una fecha y hora
 * @param {string|Date} date - Fecha/hora a formatear
 * @returns {string} Fecha y hora formateadas
 */
export function formatDateTime(date) {
  if (!date) return '-';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  return dateObj.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formatea un número
 * @param {number} num - Número a formatear
 * @param {number} decimals - Decimales a mostrar
 * @returns {string} Número formateado
 */
export function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  return num.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// ==================== COLORES Y ESTILOS ====================

/**
 * Obtiene el color asociado a un estado
 * @param {string} status - Estado (active, inactive, pending, etc.)
 * @returns {string} Color CSS
 */
export function getStatusColor(status) {
  const colors = {
    // Estados generales
    active: 'var(--color-success)',
    inactive: 'var(--color-text-tertiary)',
    suspended: 'var(--color-error)',
    pending: 'var(--color-warning)',
    cancelled: 'var(--color-error)',
    expired: 'var(--color-error)',
    
    // Prioridades
    low: 'var(--color-info)',
    medium: 'var(--color-warning)',
    high: 'var(--color-error)',
    critical: 'var(--color-error)',
    urgent: 'var(--color-error)',
    
    // Estados de proyectos
    planning: 'var(--color-info)',
    in_progress: 'var(--color-warning)',
    testing: 'var(--color-warning)',
    deployed: 'var(--color-success)',
    maintenance: 'var(--color-info)',
    
    // Estados de tickets
    open: 'var(--color-info)',
    pending_client: 'var(--color-warning)',
    resolved: 'var(--color-success)',
    closed: 'var(--color-text-tertiary)',
    
    // Estados de pagos
    paid: 'var(--color-success)',
    overdue: 'var(--color-error)',
    
    // Default
    default: 'var(--color-text-secondary)'
  };

  return colors[status] || colors.default;
}

/**
 * Obtiene el background color asociado a un estado
 * @param {string} status - Estado
 * @returns {string} Color de fondo CSS
 */
export function getStatusBgColor(status) {
  const colors = {
    active: 'var(--color-success-bg)',
    inactive: 'var(--color-bg-tertiary)',
    suspended: 'var(--color-error-bg)',
    pending: 'var(--color-warning-bg)',
    cancelled: 'var(--color-error-bg)',
    expired: 'var(--color-error-bg)',
    paid: 'var(--color-success-bg)',
    overdue: 'var(--color-error-bg)',
    open: 'var(--color-info-bg)',
    resolved: 'var(--color-success-bg)',
    closed: 'var(--color-bg-tertiary)',
    default: 'var(--color-bg-secondary)'
  };

  return colors[status] || colors.default;
}

/**
 * Obtiene las iniciales de un nombre
 * @param {string} name - Nombre completo
 * @returns {string} Iniciales (máximo 2 caracteres)
 */
export function getInitials(name) {
  if (!name) return '?';

  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ==================== VALIDACIONES ====================

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} true si es válido
 */
export function isValidEmail(email) {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida un teléfono
 * @param {string} phone - Teléfono a validar
 * @returns {boolean} true si es válido
 */
export function isValidPhone(phone) {
  if (!phone) return false;
  // Permite formatos: +123456789, 123-456-7890, (123) 456-7890, etc.
  const regex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return regex.test(phone);
}

/**
 * Valida una URL
 * @param {string} url - URL a validar
 * @returns {boolean} true si es válida
 */
export function isValidUrl(url) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida un dominio
 * @param {string} domain - Dominio a validar
 * @returns {boolean} true si es válido
 */
export function isValidDomain(domain) {
  if (!domain) return false;
  const regex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  return regex.test(domain);
}

// ==================== FECHAS Y TIEMPO ====================

/**
 * Calcula los días hasta una fecha
 * @param {string|Date} date - Fecha objetivo
 * @returns {number} Días restantes (negativo si ya pasó)
 */
export function daysUntil(date) {
  if (!date) return 0;

  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  // Resetear horas para comparar solo fechas
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Calcula los días transcurridos desde una fecha
 * @param {string|Date} date - Fecha de inicio
 * @returns {number} Días transcurridos
 */
export function daysSince(date) {
  return -daysUntil(date);
}

/**
 * Agrega meses a una fecha
 * @param {Date} date - Fecha base
 * @param {number} months - Meses a agregar
 * @returns {Date} Nueva fecha
 */
export function addMonths(date, months) {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
}

/**
 * Agrega días a una fecha
 * @param {Date} date - Fecha base
 * @param {number} days - Días a agregar
 * @returns {Date} Nueva fecha
 */
export function addDays(date, days) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

/**
 * Verifica si una fecha está en el pasado
 * @param {string|Date} date - Fecha a verificar
 * @returns {boolean} true si está en el pasado
 */
export function isPastDate(date) {
  return daysUntil(date) < 0;
}

/**
 * Formatea una duración en días a texto legible
 * @param {number} days - Número de días
 * @returns {string} Texto formateado
 */
export function formatDuration(days) {
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  if (days === -1) return 'Ayer';
  if (days > 0) return `En ${days} día${days > 1 ? 's' : ''}`;
  return `Hace ${Math.abs(days)} día${Math.abs(days) > 1 ? 's' : ''}`;
}

// ==================== STRINGS ====================

/**
 * Trunca un texto
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
export function truncate(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Capitaliza la primera letra
 * @param {string} text - Texto
 * @returns {string} Texto capitalizado
 */
export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convierte a Title Case
 * @param {string} text - Texto
 * @returns {string} Texto en Title Case
 */
export function toTitleCase(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Sanitiza HTML para prevenir XSS
 * @param {string} html - HTML a sanitizar
 * @returns {string} HTML sanitizado
 */
export function sanitizeHTML(html) {
  if (!html) return '';
  
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Remueve tags HTML
 * @param {string} html - HTML
 * @returns {string} Texto sin tags
 */
export function stripHTML(html) {
  if (!html) return '';
  
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

// ==================== UI HELPERS ====================

/**
 * Muestra un toast/notificación
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duración en ms
 */
export function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) {
    console.warn('Toast container not found');
    return;
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
  };

  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-message">${sanitizeHTML(message)}</div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  container.appendChild(toast);

  // Animar entrada
  setTimeout(() => toast.classList.add('toast-show'), 10);

  // Auto-remover
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Muestra un modal de confirmación
 * @param {string} message - Mensaje
 * @param {Function} onConfirm - Callback al confirmar
 * @param {Function} onCancel - Callback al cancelar
 */
export function showConfirm(message, onConfirm, onCancel = null) {
  const confirmed = confirm(message);
  if (confirmed && onConfirm) {
    onConfirm();
  } else if (!confirmed && onCancel) {
    onCancel();
  }
}

/**
 * Copia texto al clipboard
 * @param {string} text - Texto a copiar
 * @returns {Promise<boolean>} true si se copió exitosamente
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copiado al portapapeles', 'success', 2000);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    showToast('Error al copiar', 'error');
    return false;
  }
}

// ==================== UTILIDADES DE DATOS ====================

/**
 * Descarga un archivo JSON
 * @param {object} data - Datos a exportar
 * @param {string} filename - Nombre del archivo
 */
export function downloadJSON(data, filename = 'data.json') {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
  showToast('Archivo descargado', 'success');
}

/**
 * Descarga un archivo CSV
 * @param {Array} data - Array de objetos
 * @param {string} filename - Nombre del archivo
 */
export function downloadCSV(data, filename = 'data.csv') {
  if (!data || data.length === 0) {
    showToast('No hay datos para exportar', 'warning');
    return;
  }

  // Extraer headers
  const headers = Object.keys(data[0]);
  
  // Crear CSV
  let csv = headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Escapar comillas y valores con comas
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csv += values.join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
  showToast('CSV descargado', 'success');
}

/**
 * Debounce function
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función debounced
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Genera un ID único
 * @returns {string} ID único
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Ordena un array de objetos por una propiedad
 * @param {Array} array - Array a ordenar
 * @param {string} key - Propiedad por la cual ordenar
 * @param {string} order - 'asc' o 'desc'
 * @returns {Array} Array ordenado
 */
export function sortBy(array, key, order = 'asc') {
  return [...array].sort((a, b) => {
    const valueA = a[key];
    const valueB = b[key];

    if (valueA === valueB) return 0;

    const comparison = valueA > valueB ? 1 : -1;
    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * Filtra un array de objetos por búsqueda en múltiples campos
 * @param {Array} array - Array a filtrar
 * @param {string} searchTerm - Término de búsqueda
 * @param {Array} fields - Campos donde buscar
 * @returns {Array} Array filtrado
 */
export function searchInFields(array, searchTerm, fields) {
  if (!searchTerm || searchTerm.trim() === '') return array;

  const term = searchTerm.toLowerCase().trim();

  return array.filter(item => {
    return fields.some(field => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(term);
    });
  });
}

// ==================== STORAGE ====================

/**
 * Guarda en localStorage con manejo de errores
 * @param {string} key - Clave
 * @param {any} value - Valor
 * @returns {boolean} true si se guardó exitosamente
 */
export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    showToast('Error al guardar datos', 'error');
    return false;
  }
}

/**
 * Lee de localStorage con manejo de errores
 * @param {string} key - Clave
 * @param {any} defaultValue - Valor por defecto
 * @returns {any} Valor o defaultValue
 */
export function loadFromStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
}

// Exportar todas las funciones
export default {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  getStatusColor,
  getStatusBgColor,
  getInitials,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  isValidDomain,
  daysUntil,
  daysSince,
  addMonths,
  addDays,
  isPastDate,
  formatDuration,
  truncate,
  capitalize,
  toTitleCase,
  sanitizeHTML,
  stripHTML,
  showToast,
  showConfirm,
  copyToClipboard,
  downloadJSON,
  downloadCSV,
  debounce,
  generateId,
  sortBy,
  searchInFields,
  saveToStorage,
  loadFromStorage
};
