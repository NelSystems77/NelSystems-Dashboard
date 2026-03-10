/**
 * NELSYSTEMS DASHBOARD - UTILITIES
 * 
 * Funciones de utilidad general del sistema
 */

// ==================== FORMATEO ====================

/**
 * Formatea una fecha
 */
export function formatDate(date, format = 'short') {
  if (!date) return '-';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  const options = {
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  };
  
  return d.toLocaleDateString('es-ES', options[format] || options.short);
}

/**
 * Formatea fecha y hora
 */
export function formatDateTime(date) {
  if (!date) return '-';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  return d.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formatea un monto de dinero
 */
export function formatCurrency(amount, currency = 'USD') {
  if (amount === null || amount === undefined) return '-';
  
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CRC: '₡'
  };
  
  const symbol = symbols[currency] || '$';
  return `${symbol}${parseFloat(amount).toFixed(2)}`;
}

/**
 * Formatea un número
 */
export function formatNumber(number, decimals = 0) {
  if (number === null || number === undefined) return '-';
  return parseFloat(number).toFixed(decimals);
}

/**
 * Formatea un porcentaje
 */
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined) return '-';
  return `${parseFloat(value).toFixed(decimals)}%`;
}

// ==================== FECHAS ====================

/**
 * Calcula días entre dos fechas
 */
export function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calcula días hasta una fecha
 */
export function daysUntil(date) {
  return daysBetween(new Date(), date);
}

/**
 * Verifica si una fecha ya pasó
 */
export function isPast(date) {
  return new Date(date) < new Date();
}

/**
 * Verifica si una fecha está próxima (dentro de X días)
 */
export function isUpcoming(date, days = 30) {
  const daysUntilDate = daysUntil(date);
  return daysUntilDate >= 0 && daysUntilDate <= days;
}

/**
 * Agrega días a una fecha
 */
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Agrega meses a una fecha
 */
export function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Agrega años a una fecha
 */
export function addYears(date, years) {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

// ==================== STRINGS ====================

/**
 * Capitaliza la primera letra
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convierte a título
 */
export function toTitleCase(str) {
  if (!str) return '';
  return str.split(' ').map(capitalize).join(' ');
}

/**
 * Trunca un texto
 */
export function truncate(str, maxLength = 50) {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

/**
 * Genera iniciales
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// ==================== VALIDACIONES ====================

/**
 * Valida email
 */
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida URL
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida teléfono
 */
export function isValidPhone(phone) {
  const regex = /^[\d\s\-\+\(\)]+$/;
  return phone && phone.length >= 7 && regex.test(phone);
}

// ==================== ARRAYS ====================

/**
 * Ordena array por propiedad
 */
export function sortBy(array, key, ascending = true) {
  return [...array].sort((a, b) => {
    const valueA = a[key];
    const valueB = b[key];
    
    if (valueA < valueB) return ascending ? -1 : 1;
    if (valueA > valueB) return ascending ? 1 : -1;
    return 0;
  });
}

/**
 * Agrupa array por propiedad
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
}

/**
 * Filtra valores únicos
 */
export function unique(array) {
  return [...new Set(array)];
}

// ==================== OBJETOS ====================

/**
 * Deep clone de un objeto
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Verifica si un objeto está vacío
 */
export function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

// ==================== COLORES ====================

/**
 * Genera color por estado
 */
export function getStatusColor(status) {
  const colors = {
    active: '#10b981',
    inactive: '#6b7280',
    pending: '#f59e0b',
    expired: '#ef4444',
    cancelled: '#ef4444',
    suspended: '#f59e0b',
    open: '#3b82f6',
    in_progress: '#8b5cf6',
    resolved: '#10b981',
    closed: '#6b7280',
    paid: '#10b981',
    overdue: '#ef4444'
  };
  
  return colors[status] || '#6b7280';
}

/**
 * Genera color por prioridad
 */
export function getPriorityColor(priority) {
  const colors = {
    low: '#6b7280',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
    urgent: '#dc2626'
  };
  
  return colors[priority] || '#6b7280';
}

// ==================== NÚMEROS ====================

/**
 * Genera número aleatorio
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Redondea a N decimales
 */
export function round(number, decimals = 2) {
  return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// ==================== DEBOUNCE & THROTTLE ====================

/**
 * Debounce function
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
 * Throttle function
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ==================== STORAGE ====================

/**
 * Guarda en localStorage de forma segura
 */
export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error saving to storage:', error);
    return false;
  }
}

/**
 * Lee desde localStorage de forma segura
 */
export function loadFromStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading from storage:', error);
    return defaultValue;
  }
}

// ==================== NOTIFICACIONES ====================

/**
 * Muestra una notificación toast
 */
export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Muestra confirmación
 */
export function showConfirm(message, onConfirm, onCancel) {
  if (confirm(message)) {
    onConfirm && onConfirm();
  } else {
    onCancel && onCancel();
  }
}

// ==================== DOM ====================

/**
 * Sanitiza HTML para prevenir XSS
 */
export function sanitizeHtml(html) {
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
}

/**
 * Crea elemento con atributos
 */
export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  
  Object.keys(attributes).forEach(key => {
    if (key === 'className') {
      element.className = attributes[key];
    } else if (key === 'style' && typeof attributes[key] === 'object') {
      Object.assign(element.style, attributes[key]);
    } else if (key.startsWith('on') && typeof attributes[key] === 'function') {
      const event = key.substring(2).toLowerCase();
      element.addEventListener(event, attributes[key]);
    } else {
      element.setAttribute(key, attributes[key]);
    }
  });
  
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  });
  
  return element;
}

export default {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatNumber,
  formatPercentage,
  daysBetween,
  daysUntil,
  isPast,
  isUpcoming,
  addDays,
  addMonths,
  addYears,
  capitalize,
  toTitleCase,
  truncate,
  getInitials,
  isValidEmail,
  isValidUrl,
  isValidPhone,
  sortBy,
  groupBy,
  unique,
  deepClone,
  isEmpty,
  getStatusColor,
  getPriorityColor,
  randomInt,
  round,
  debounce,
  throttle,
  saveToStorage,
  loadFromStorage,
  showToast,
  showConfirm,
  sanitizeHtml,
  createElement
};
