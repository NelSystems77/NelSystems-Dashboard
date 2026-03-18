/**
 * NELSYSTEMS DASHBOARD - PAYMENTS SERVICE
 * 
 * Servicio para gestión de pagos
 */

import db from '../database/db.js';
import { showToast, daysUntil, isPastDate } from '../utils/helpers.js';

class PaymentsService {
  getAll(filters = {}) {
    let payments = db.select('payments');
    
    if (filters.status) {
      payments = payments.filter(p => p.status === filters.status);
    }
    
    if (filters.clientId) {
      payments = payments.filter(p => p.clientId === filters.clientId);
    }
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      payments = payments.filter(p => 
        p.invoiceNumber.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
      );
    }
    
    return payments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getById(id) {
    return db.selectById('payments', id);
  }

  create(paymentData) {
    try {
      const validation = this.validate(paymentData);
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return null;
      }

      // Verificar que el número de factura sea único
      if (db.exists('payments', { invoiceNumber: paymentData.invoiceNumber })) {
        showToast('Este número de factura ya existe', 'error');
        return null;
      }

      // Determinar estado basado en fecha de vencimiento
      let status = paymentData.status || 'pending';
      if (status === 'pending' && isPastDate(paymentData.dueDate)) {
        status = 'overdue';
      }

      const payment = db.insert('payments', {
        clientId: paymentData.clientId,
        serviceId: paymentData.serviceId || null,
        invoiceNumber: paymentData.invoiceNumber.trim(),
        description: paymentData.description.trim(),
        amount: parseFloat(paymentData.amount),
        currency: paymentData.currency || 'USD',
        dueDate: paymentData.dueDate,
        paidDate: paymentData.paidDate || null,
        status: status,
        paymentMethod: paymentData.paymentMethod || null,
        transactionId: paymentData.transactionId?.trim() || null,
        notes: paymentData.notes?.trim() || null
      });

      showToast('Pago creado exitosamente', 'success');
      return payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      showToast('Error al crear pago', 'error');
      return null;
    }
  }

  update(id, updates) {
    try {
      const payment = this.getById(id);
      if (!payment) {
        showToast('Pago no encontrado', 'error');
        return false;
      }

      const validation = this.validate({ ...payment, ...updates });
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return false;
      }

      // Verificar unicidad de número de factura si cambió
      if (updates.invoiceNumber && updates.invoiceNumber !== payment.invoiceNumber) {
        if (db.exists('payments', { invoiceNumber: updates.invoiceNumber })) {
          showToast('Este número de factura ya existe', 'error');
          return false;
        }
      }

      // Si se marca como pagado, establecer fecha de pago
      if (updates.status === 'paid' && !updates.paidDate && !payment.paidDate) {
        updates.paidDate = new Date().toISOString().split('T')[0];
      }

      const count = db.updateById('payments', id, updates);

      if (count > 0) {
        showToast('Pago actualizado exitosamente', 'success');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error updating payment:', error);
      showToast('Error al actualizar pago', 'error');
      return false;
    }
  }

  delete(id) {
    try {
      const payment = this.getById(id);
      if (!payment) {
        showToast('Pago no encontrado', 'error');
        return false;
      }

      const count = db.deleteById('payments', id);
      
      if (count > 0) {
        showToast('Pago eliminado exitosamente', 'success');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error deleting payment:', error);
      showToast('Error al eliminar pago', 'error');
      return false;
    }
  }

  markAsPaid(id, paymentMethod = null, transactionId = null) {
    const updates = {
      status: 'paid',
      paidDate: new Date().toISOString().split('T')[0]
    };

    if (paymentMethod) updates.paymentMethod = paymentMethod;
    if (transactionId) updates.transactionId = transactionId;

    return this.update(id, updates);
  }

  markAsOverdue(id) {
    return this.update(id, { status: 'overdue' });
  }

  getStats() {
    const payments = this.getAll();
    
    return {
      total: payments.length,
      pending: payments.filter(p => p.status === 'pending').length,
      paid: payments.filter(p => p.status === 'paid').length,
      overdue: payments.filter(p => p.status === 'overdue').length,
      cancelled: payments.filter(p => p.status === 'cancelled').length,
      totalPending: payments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0),
      totalPaid: payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0),
      totalOverdue: payments
        .filter(p => p.status === 'overdue')
        .reduce((sum, p) => sum + p.amount, 0)
    };
  }

  getPending() {
    return this.getAll({ status: 'pending' });
  }

  getOverdue() {
    return this.getAll({ status: 'overdue' });
  }

  getDueThisMonth() {
    const payments = this.getAll();
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return payments.filter(p => {
      const dueDate = new Date(p.dueDate);
      return dueDate >= firstDay && dueDate <= lastDay;
    });
  }

  validate(paymentData) {
    if (!paymentData.clientId) {
      return { valid: false, error: 'El cliente es requerido' };
    }

    if (!paymentData.invoiceNumber || paymentData.invoiceNumber.trim().length === 0) {
      return { valid: false, error: 'El número de factura es requerido' };
    }

    if (!paymentData.description || paymentData.description.trim().length === 0) {
      return { valid: false, error: 'La descripción es requerida' };
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      return { valid: false, error: 'El monto debe ser mayor a 0' };
    }

    if (!paymentData.dueDate) {
      return { valid: false, error: 'La fecha de vencimiento es requerida' };
    }

    if (paymentData.paidDate && new Date(paymentData.paidDate) > new Date()) {
      return { valid: false, error: 'La fecha de pago no puede ser futura' };
    }

    return { valid: true };
  }

  // Actualizar pagos vencidos automáticamente
  updateOverduePayments() {
    const pending = this.getPending();
    let updated = 0;

    pending.forEach(payment => {
      if (isPastDate(payment.dueDate)) {
        this.markAsOverdue(payment.id);
        updated++;
      }
    });

    if (updated > 0) {
      console.log(`${updated} pago(s) marcado(s) como vencido(s)`);
    }

    return updated;
  }
}

export const paymentsService = new PaymentsService();
export default paymentsService;
