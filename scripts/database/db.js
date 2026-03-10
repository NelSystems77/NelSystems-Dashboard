/**
 * NELSYSTEMS DASHBOARD - DATABASE MANAGER
 * 
 * Sistema de persistencia usando localStorage
 * Implementa patrón Repository y proporciona API tipo ORM
 */

import { DB_SCHEMA, DEFAULT_SETTINGS } from './schema.js';

class DatabaseManager {
  constructor() {
    this.storageKey = 'nelsystems_db';
    this.db = this.loadDatabase();
  }

  /**
   * Carga la base de datos desde localStorage
   */
  loadDatabase() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
      return this.initializeDatabase();
    } catch (error) {
      console.error('Error loading database:', error);
      return this.initializeDatabase();
    }
  }

  /**
   * Inicializa una nueva base de datos
   */
  initializeDatabase() {
    const db = {
      version: DB_SCHEMA.version,
      tables: {}
    };

    // Crear todas las tablas vacías
    Object.keys(DB_SCHEMA.tables).forEach(tableName => {
      db.tables[tableName] = [];
    });

    // Insertar configuraciones por defecto
    Object.values(DEFAULT_SETTINGS).forEach(setting => {
      this.insert('settings', {
        id: this.generateId(),
        ...setting,
        updatedAt: new Date().toISOString()
      }, db);
    });

    // Crear usuario administrador por defecto
    this.insert('users', {
      id: this.generateId(),
      email: 'admin@nelsystems.com',
      passwordHash: this.hashPassword('123456789AiDyXm'),
      name: 'Administrador',
      role: 'admin',
      avatar: null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: null
    }, db);

    this.saveDatabase(db);
    return db;
  }

  /**
   * Guarda la base de datos en localStorage
   */
  saveDatabase(db = this.db) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(db));
      return true;
    } catch (error) {
      console.error('Error saving database:', error);
      return false;
    }
  }

  /**
   * Genera un ID único
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Hash simple de contraseña (en producción usar bcrypt o similar)
   */
  hashPassword(password) {
    // NOTA: En producción, usar una librería de hashing apropiada
    // Esta es solo una implementación básica para demostración
    let hash = 0;
    const str = `${password}_nelsystems_salt`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `hashed_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Verifica una contraseña
   */
  verifyPassword(password, hash) {
    return this.hashPassword(password) === hash;
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * INSERT - Inserta un nuevo registro
   */
  insert(tableName, data, db = this.db) {
    if (!db.tables[tableName]) {
      throw new Error(`Table ${tableName} does not exist`);
    }

    const record = {
      id: data.id || this.generateId(),
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    };

    db.tables[tableName].push(record);
    this.saveDatabase(db);
    return record;
  }

  /**
   * SELECT - Busca registros
   */
  select(tableName, conditions = {}) {
    if (!this.db.tables[tableName]) {
      throw new Error(`Table ${tableName} does not exist`);
    }

    let results = [...this.db.tables[tableName]];

    // Aplicar condiciones
    Object.keys(conditions).forEach(key => {
      results = results.filter(record => {
        if (typeof conditions[key] === 'function') {
          return conditions[key](record[key], record);
        }
        return record[key] === conditions[key];
      });
    });

    return results;
  }

  /**
   * SELECT ONE - Busca un solo registro
   */
  selectOne(tableName, conditions = {}) {
    const results = this.select(tableName, conditions);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * SELECT BY ID - Busca por ID
   */
  selectById(tableName, id) {
    return this.selectOne(tableName, { id });
  }

  /**
   * UPDATE - Actualiza registros
   */
  update(tableName, conditions, updates) {
    if (!this.db.tables[tableName]) {
      throw new Error(`Table ${tableName} does not exist`);
    }

    let updatedCount = 0;
    this.db.tables[tableName] = this.db.tables[tableName].map(record => {
      const matches = Object.keys(conditions).every(key => record[key] === conditions[key]);
      
      if (matches) {
        updatedCount++;
        return {
          ...record,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      
      return record;
    });

    this.saveDatabase();
    return updatedCount;
  }

  /**
   * UPDATE BY ID - Actualiza por ID
   */
  updateById(tableName, id, updates) {
    return this.update(tableName, { id }, updates);
  }

  /**
   * DELETE - Elimina registros
   */
  delete(tableName, conditions) {
    if (!this.db.tables[tableName]) {
      throw new Error(`Table ${tableName} does not exist`);
    }

    const initialLength = this.db.tables[tableName].length;
    
    this.db.tables[tableName] = this.db.tables[tableName].filter(record => {
      return !Object.keys(conditions).every(key => record[key] === conditions[key]);
    });

    const deletedCount = initialLength - this.db.tables[tableName].length;
    this.saveDatabase();
    return deletedCount;
  }

  /**
   * DELETE BY ID - Elimina por ID
   */
  deleteById(tableName, id) {
    return this.delete(tableName, { id });
  }

  /**
   * COUNT - Cuenta registros
   */
  count(tableName, conditions = {}) {
    return this.select(tableName, conditions).length;
  }

  /**
   * EXISTS - Verifica si existe un registro
   */
  exists(tableName, conditions) {
    return this.count(tableName, conditions) > 0;
  }

  // ==================== UTILIDADES ====================

  /**
   * Limpia toda la base de datos
   */
  clearDatabase() {
    if (confirm('¿Está seguro de que desea eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
      localStorage.removeItem(this.storageKey);
      this.db = this.initializeDatabase();
      return true;
    }
    return false;
  }

  /**
   * Exporta la base de datos como JSON
   */
  exportDatabase() {
    return JSON.stringify(this.db, null, 2);
  }

  /**
   * Importa una base de datos desde JSON
   */
  importDatabase(jsonData) {
    try {
      const importedDb = JSON.parse(jsonData);
      this.db = importedDb;
      this.saveDatabase();
      return true;
    } catch (error) {
      console.error('Error importing database:', error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas de la base de datos
   */
  getStats() {
    const stats = {};
    Object.keys(this.db.tables).forEach(tableName => {
      stats[tableName] = this.db.tables[tableName].length;
    });
    return stats;
  }
}

// Exportar instancia singleton
export const db = new DatabaseManager();
export default db;
