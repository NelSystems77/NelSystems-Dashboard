/**
 * NELSYSTEMS DASHBOARD - AUTHENTICATION MODULE
 * 
 * Maneja autenticación, autorización y sesiones de usuario
 * Implementa buenas prácticas de seguridad
 */

import db from '../database/db.js';

class AuthManager {
  constructor() {
    this.sessionKey = 'nelsystems_session';
    this.currentUser = null;
    this.loadSession();
  }

  /**
   * Carga la sesión actual desde localStorage
   */
  loadSession() {
    try {
      const session = localStorage.getItem(this.sessionKey);
      if (session) {
        const sessionData = JSON.parse(session);
        
        // Verificar si la sesión ha expirado (24 horas)
        const expirationTime = new Date(sessionData.expiresAt).getTime();
        const now = new Date().getTime();
        
        if (now < expirationTime) {
          this.currentUser = sessionData.user;
          return true;
        } else {
          this.logout();
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
      this.logout();
    }
    return false;
  }

  /**
   * Guarda la sesión en localStorage
   */
  saveSession(user) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Sesión de 24 horas

    const session = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar
      },
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(this.sessionKey, JSON.stringify(session));
    this.currentUser = session.user;
  }

  /**
   * Inicia sesión con email y contraseña
   */
  async login(email, password) {
    try {
      // Sanitizar inputs
      email = this.sanitizeInput(email).toLowerCase().trim();
      
      if (!email || !password) {
        return {
          success: false,
          error: 'Email y contraseña son requeridos'
        };
      }

      // Validar formato de email
      if (!this.validateEmail(email)) {
        return {
          success: false,
          error: 'Formato de email inválido'
        };
      }

      // Buscar usuario
      const user = db.selectOne('users', { email });
      
      if (!user) {
        return {
          success: false,
          error: 'Credenciales incorrectas'
        };
      }

      // Verificar que el usuario esté activo
      if (!user.isActive) {
        return {
          success: false,
          error: 'Usuario inactivo. Contacte al administrador.'
        };
      }

      // Verificar contraseña
      if (!db.verifyPassword(password, user.passwordHash)) {
        return {
          success: false,
          error: 'Credenciales incorrectas'
        };
      }

      // Actualizar último login
      db.updateById('users', user.id, {
        lastLogin: new Date().toISOString()
      });

      // Guardar sesión
      this.saveSession(user);

      return {
        success: true,
        user: this.currentUser
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Error al iniciar sesión'
      };
    }
  }

  /**
   * Cierra la sesión actual
   */
  logout() {
    localStorage.removeItem(this.sessionKey);
    this.currentUser = null;
    
    // Redirigir al login
    if (window.location.hash !== '#/login') {
      window.location.hash = '#/login';
    }
  }

  /**
   * Verifica si hay una sesión activa
   */
  isAuthenticated() {
    return this.currentUser !== null;
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role) {
    return this.currentUser && this.currentUser.role === role;
  }

  /**
   * Verifica si el usuario es administrador
   */
  isAdmin() {
    return this.hasRole('admin');
  }

  /**
   * Requiere autenticación (usar en páginas protegidas)
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.hash = '#/login';
      return false;
    }
    return true;
  }

  /**
   * Requiere rol de administrador
   */
  requireAdmin() {
    if (!this.requireAuth()) {
      return false;
    }
    
    if (!this.isAdmin()) {
      alert('Acceso denegado. Se requieren permisos de administrador.');
      window.location.hash = '#/dashboard';
      return false;
    }
    
    return true;
  }

  /**
   * Cambia la contraseña del usuario actual
   */
  async changePassword(currentPassword, newPassword) {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          error: 'No hay sesión activa'
        };
      }

      // Validar nueva contraseña
      const validation = this.validatePassword(newPassword);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Obtener usuario actual
      const user = db.selectById('users', this.currentUser.id);
      
      // Verificar contraseña actual
      if (!db.verifyPassword(currentPassword, user.passwordHash)) {
        return {
          success: false,
          error: 'Contraseña actual incorrecta'
        };
      }

      // Actualizar contraseña
      db.updateById('users', user.id, {
        passwordHash: db.hashPassword(newPassword)
      });

      return {
        success: true,
        message: 'Contraseña actualizada exitosamente'
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: 'Error al cambiar la contraseña'
      };
    }
  }

  /**
   * Crea un nuevo usuario (solo admin)
   */
  async createUser(userData) {
    try {
      if (!this.isAdmin()) {
        return {
          success: false,
          error: 'Permisos insuficientes'
        };
      }

      // Validar datos
      const { email, password, name, role = 'operator' } = userData;
      
      if (!email || !password || !name) {
        return {
          success: false,
          error: 'Datos incompletos'
        };
      }

      // Validar email
      if (!this.validateEmail(email)) {
        return {
          success: false,
          error: 'Formato de email inválido'
        };
      }

      // Validar que el email no exista
      if (db.exists('users', { email: email.toLowerCase().trim() })) {
        return {
          success: false,
          error: 'El email ya está registrado'
        };
      }

      // Validar contraseña
      const validation = this.validatePassword(password);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Crear usuario
      const user = db.insert('users', {
        email: email.toLowerCase().trim(),
        passwordHash: db.hashPassword(password),
        name: name.trim(),
        role,
        avatar: null,
        isActive: true
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      };
    } catch (error) {
      console.error('Create user error:', error);
      return {
        success: false,
        error: 'Error al crear usuario'
      };
    }
  }

  // ==================== VALIDACIONES ====================

  /**
   * Valida formato de email
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida fortaleza de contraseña
   */
  validatePassword(password) {
    if (password.length < 8) {
      return {
        valid: false,
        error: 'La contraseña debe tener al menos 8 caracteres'
      };
    }

    // Requerir al menos una letra y un número
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return {
        valid: false,
        error: 'La contraseña debe contener letras y números'
      };
    }

    return { valid: true };
  }

  /**
   * Sanitiza input para prevenir XSS
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/[<>'"]/g, '') // Remover caracteres peligrosos
      .trim();
  }
}

// Exportar instancia singleton
export const auth = new AuthManager();
export default auth;
