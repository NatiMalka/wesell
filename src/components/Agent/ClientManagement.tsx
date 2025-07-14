import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Phone, Calendar, Filter } from 'lucide-react';
import { Modal } from '../UI/Modal';
import { ConfirmModal } from '../UI/ConfirmModal';
import { Client, PlanType, ClientStatus, PLAN_NAMES, PLAN_PRICES, User } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import { useUserPreferences } from '../../hooks/useUserPreferences';

interface ClientManagementProps {
  clients: Client[];
  user: User;
  onAddClient: (client: Omit<Client, 'id' | 'agentId' | 'createdAt' | 'updatedAt'>) => Promise<Client>;
  onUpdateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
}

export const ClientManagement: React.FC<ClientManagementProps> = ({
  clients,
  user,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
}) => {
  const { 
    preferences, 
    setClientSearchTerm, 
    setClientStatusFilter 
  } = useUserPreferences(user.id);
  
  // Get values from preferences or defaults
  const searchTerm = preferences?.clientSearchTerm || '';
  const statusFilter = preferences?.clientStatusFilter || 'all';
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    clientId: '',
    clientName: '',
    isDeleting: false
  });
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    plan: 'webinar_price' as PlanType,
    status: 'potential' as ClientStatus,
    notes: '',
  });

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const clientData = {
      ...formData,
      price: PLAN_PRICES[formData.plan],
      purchaseDate: formData.status === 'purchased' ? new Date() : new Date(),
    };

    try {
      if (editingClient) {
        await onUpdateClient(editingClient.id, clientData);
      } else {
        await onAddClient(clientData);
      }
      
      setIsModalOpen(false);
      setEditingClient(null);
      setFormData({
        name: '',
        phone: '',
        plan: 'webinar_price',
        status: 'potential',
        notes: '',
      });
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      plan: client.plan,
      status: client.status,
      notes: client.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    const client = clients.find(c => c.id === id);
    const clientName = client?.name || 'Unknown Client';
    
    setConfirmModal({
      isOpen: true,
      clientId: id,
      clientName,
      isDeleting: false
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.clientId) return;
    
    setConfirmModal(prev => ({ ...prev, isDeleting: true }));
    
    try {
      await onDeleteClient(confirmModal.clientId);
      
      // Close modal
      setConfirmModal({
        isOpen: false,
        clientId: '',
        clientName: '',
        isDeleting: false
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      setConfirmModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleCancelDelete = () => {
    setConfirmModal({
      isOpen: false,
      clientId: '',
      clientName: '',
      isDeleting: false
    });
  };

  const getStatusColor = (status: ClientStatus) => {
    switch (status) {
      case 'purchased': return 'bg-success-100 text-success-800';
      case 'considering': return 'bg-yellow-100 text-yellow-800';
      case 'potential': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: ClientStatus) => {
    switch (status) {
      case 'purchased': return 'רכש';
      case 'considering': return 'מתלבט';
      case 'potential': return 'פוטנציאלי';
      case 'cancelled': return 'חזר בו';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">ניהול לקוחות</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 ml-2" />
          הוסף לקוח חדש
        </motion.button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="חפש לקוח..."
              value={searchTerm}
              onChange={(e) => setClientSearchTerm(e.target.value)}
              className="input-field pr-10"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setClientStatusFilter(e.target.value as ClientStatus | 'all')}
              className="input-field pr-10 appearance-none"
            >
              <option value="all">כל הסטטוסים</option>
              <option value="purchased">רכש</option>
              <option value="considering">מתלבט</option>
              <option value="potential">פוטנציאלי</option>
              <option value="cancelled">חזר בו</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredClients.map((client) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -5 }}
              className="card hover:shadow-xl transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                  <div className="flex items-center text-gray-600 mt-1">
                    <Phone className="w-4 h-4 ml-1" />
                    <span className="text-sm">{client.phone}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                  {getStatusText(client.status)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">תוכנית:</span>
                  <span className="text-sm font-medium">{PLAN_NAMES[client.plan]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">מחיר:</span>
                  <span className="text-sm font-medium text-success-600">
                    {formatCurrency(client.price)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">תאריך:</span>
                  <span className="text-sm">
                    {new Date(client.purchaseDate).toLocaleDateString('he-IL')}
                  </span>
                </div>
              </div>

              {client.notes && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {client.notes}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEdit(client)}
                  className="flex-1 flex items-center justify-center py-2 px-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Edit className="w-4 h-4 ml-1" />
                  ערוך
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDeleteClick(client.id)}
                  className="flex-1 flex items-center justify-center py-2 px-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4 ml-1" />
                  מחק
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">לא נמצאו לקוחות</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingClient(null);
          setFormData({
            name: '',
            phone: '',
            plan: 'webinar_price',
            status: 'potential',
            notes: '',
          });
        }}
        title={editingClient ? 'ערוך לקוח' : 'הוסף לקוח חדש'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              שם מלא
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              טלפון
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              תוכנית
            </label>
            <select
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value as PlanType })}
              className="input-field"
            >
              {Object.entries(PLAN_NAMES).map(([key, name]) => (
                <option key={key} value={key}>
                  {name} - {formatCurrency(PLAN_PRICES[key as PlanType])}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סטטוס
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ClientStatus })}
              className="input-field"
            >
              <option value="potential">פוטנציאלי</option>
              <option value="considering">מתלבט</option>
              <option value="purchased">רכש</option>
              <option value="cancelled">חזר בו</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              הערות
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="הערות נוספות..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 btn-secondary"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              {editingClient ? 'עדכן' : 'הוסף'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="מחיקת לקוח"
        message={`האם אתה בטוח שברצונך למחוק את ${confirmModal.clientName}?\n\nפעולה זו אינה ניתנת לביטול.`}
        type="danger"
        confirmText="מחק לקוח"
        cancelText="ביטול"
        isLoading={confirmModal.isDeleting}
      />
    </div>
  );
};