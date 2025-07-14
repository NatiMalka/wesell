import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Calendar, 
  UserPlus,
  Shield,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';
import { User } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useTeamManagement } from '../../hooks/useTeamManagement';
import { useTeamSalesSync } from '../../hooks/useTeamSalesSync';
import { Modal } from '../UI/Modal';
import { ConfirmModal } from '../UI/ConfirmModal';
import { formatCurrency } from '../../utils/calculations';

interface AgentManagementProps {
  user: User;
}

export const AgentManagement: React.FC<AgentManagementProps> = ({ user }) => {
  const { createUser } = useAuth();
  const {
    teamMembers,
    loading,
    getTeamMemberStats,
    updateTeamMember,
    removeTeamMember,
    refreshData,
  } = useTeamManagement(user.id, user.teamId || '');
  
  // Initialize team sales sync for proper agent initialization
  const { initializeTeamSales, cleanupDuplicates } = useTeamSalesSync(user.id, user.teamId || '');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedCredentials, setCopiedCredentials] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    agentId: '',
    agentName: '',
    isDeleting: false
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const filteredAgents = teamMembers.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.phone.includes(searchTerm)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAgent) {
        // Update existing agent
        await updateTeamMember(editingAgent.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        });
      } else {
        // Create new agent
        console.log('🆕 Creating new agent with teamId:', user.teamId);
        console.log('👤 Manager user data:', user);
        
        await createUser({
          ...formData,
          role: 'agent',
          teamId: user.teamId || '',
        });
      }
      
      setIsModalOpen(false);
      setEditingAgent(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
      });
      
      // Refresh data and initialize team sales
      await refreshData();
      
      // Small delay then cleanup and initialize (prevent race conditions)
      setTimeout(async () => {
        await cleanupDuplicates();
        await initializeTeamSales();
        console.log('✅ New agent setup completed');
      }, 200);
    } catch (error) {
      console.error('Error saving agent:', error);
    }
  };

  const handleEdit = (agent: User) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      password: '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (agentId: string) => {
    const agent = teamMembers.find(a => a.id === agentId);
    const agentName = agent?.name || 'Unknown Agent';
    
    setConfirmModal({
      isOpen: true,
      agentId,
      agentName,
      isDeleting: false
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.agentId) return;
    
    setConfirmModal(prev => ({ ...prev, isDeleting: true }));
    
    try {
      console.log(`🗑️ Deleting agent: ${confirmModal.agentName} (${confirmModal.agentId})`);
      await removeTeamMember(confirmModal.agentId);
      
      // Force refresh and cleanup to ensure all dashboards update
      await refreshData();
      await cleanupDuplicates();
      
      console.log('✅ Agent deletion and cleanup completed');
      
      // Close modal
      setConfirmModal({
        isOpen: false,
        agentId: '',
        agentName: '',
        isDeleting: false
      });
    } catch (error) {
      console.error('Error removing agent:', error);
      setConfirmModal(prev => ({ ...prev, isDeleting: false }));
      // You can replace this alert with a toast notification later
      alert('שגיאה בהסרת הסוכן. אנא נסה שוב.');
    }
  };

  const handleCancelDelete = () => {
    setConfirmModal({
      isOpen: false,
      agentId: '',
      agentName: '',
      isDeleting: false
    });
  };

  const copyCredentials = (email: string, password: string) => {
    const credentials = `אימייל: ${email}\nסיסמה: ${password}`;
    navigator.clipboard.writeText(credentials);
    setCopiedCredentials(email);
    setTimeout(() => setCopiedCredentials(null), 2000);
  };

  const generatePassword = () => {
    const password = Math.random().toString(36).slice(-8);
    setFormData(prev => ({ ...prev, password }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <UserPlus className="w-6 h-6 ml-2 text-purple-600" />
            ניהול סוכנים
          </h1>
          <p className="text-gray-600 mt-1">
            הוספה, עריכה והסרה של סוכנים בצוות
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-5 h-5 ml-2" />
          הוסף סוכן חדש
        </motion.button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="חפש סוכן..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pr-10"
          />
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredAgents.map((agent) => {
            const stats = getTeamMemberStats(agent.id);
            
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -5 }}
                className="card hover:shadow-xl transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center ml-3">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                      <div className="flex items-center text-gray-600 mt-1">
                        <Mail className="w-4 h-4 ml-1" />
                        <span className="text-sm">{agent.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(agent)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteClick(agent.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{agent.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {new Date(agent.createdAt).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">ביצועים החודש</span>
                    <span className="text-sm font-semibold text-purple-600">
                      {formatCurrency(stats.totalSales)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">לקוחות</span>
                    <span className="text-sm font-medium">{stats.clientCount}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">אין סוכנים בצוות</p>
        </div>
      )}

      {/* Add/Edit Agent Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAgent(null);
          setFormData({
            name: '',
            email: '',
            phone: '',
            password: '',
          });
        }}
        title={editingAgent ? 'עריכת סוכן' : 'הוספת סוכן חדש'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              שם מלא
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              אימייל
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="input-field"
              required
            />
          </div>

          {!editingAgent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סיסמה
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="input-field pr-20"
                  required
                />
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="צור סיסמה"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="btn-primary bg-purple-600 hover:bg-purple-700"
            >
              {editingAgent ? 'עדכן' : 'הוסף'}
            </button>
          </div>

          {!editingAgent && formData.email && formData.password && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">
                פרטי התחברות לשיתוף:
              </p>
              <div className="text-sm text-gray-600">
                <p>אימייל: {formData.email}</p>
                <p>סיסמה: {formData.password}</p>
              </div>
              <button
                type="button"
                onClick={() => copyCredentials(formData.email, formData.password)}
                className="mt-2 flex items-center text-sm text-purple-600 hover:text-purple-700"
              >
                {copiedCredentials === formData.email ? (
                  <Check className="w-4 h-4 ml-1" />
                ) : (
                  <Copy className="w-4 h-4 ml-1" />
                )}
                {copiedCredentials === formData.email ? 'הועתק!' : 'העתק פרטים'}
              </button>
            </div>
          )}
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="הסרת סוכן מהצוות"
        message={`האם אתה בטוח שברצונך להסיר את ${confirmModal.agentName} מהצוות?\n\nפעולה זו תעביר את הלקוחות שלו אליך ותמחק את כל הנתונים שלו מהמערכת.`}
        type="danger"
        confirmText="הסר מהצוות"
        cancelText="ביטול"
        isLoading={confirmModal.isDeleting}
      />
    </div>
  );
}; 