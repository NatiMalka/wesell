import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import { useClients } from './hooks/useClients';
import { LoginForm } from './components/Auth/LoginForm';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { AgentDashboard } from './components/Agent/AgentDashboard';
import { ClientManagement } from './components/Agent/ClientManagement';
import { GoalsAndBonuses } from './components/Agent/GoalsAndBonuses';
import { Reports } from './components/Agent/Reports';
import { TeamManagerDashboard } from './components/Manager/TeamManagerDashboard';
import { AgentManagement } from './components/Manager/AgentManagement';
import { NotificationCenter } from './components/Manager/NotificationCenter';

function App() {
  const { user, loading, login, logout, createUser, getTeamMembers } = useAuth();
  const { clients, addClient, updateClient, deleteClient } = useClients(user?.id || '');
  const [activeTab, setActiveTab] = useState(user?.role === 'manager' ? 'manager-dashboard' : 'dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={login} />;
  }

  const renderContent = () => {
    // Manager routes
    if (user.role === 'manager') {
      switch (activeTab) {
        case 'manager-dashboard':
          return <TeamManagerDashboard user={user} />;
        case 'team-overview':
          return <TeamManagerDashboard user={user} />;
        case 'agent-management':
          return <AgentManagement user={user} />;
        case 'team-reports':
          return (
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">דוחות צוות</h2>
              <p className="text-gray-600">בקרוב...</p>
            </div>
          );
        case 'notifications':
          return <NotificationCenter user={user} />;
        case 'settings':
          return (
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">הגדרות</h2>
              <p className="text-gray-600">בקרוב...</p>
            </div>
          );
        default:
          return <TeamManagerDashboard user={user} />;
      }
    }

    // Agent routes
    switch (activeTab) {
      case 'dashboard':
        return <AgentDashboard user={user} clients={clients} />;
      case 'clients':
        return (
          <ClientManagement
            clients={clients}
            onAddClient={addClient}
            onUpdateClient={updateClient}
            onDeleteClient={deleteClient}
          />
        );
      case 'goals':
        return (
          <GoalsAndBonuses clients={clients} />
        );
      case 'reports':
        return (
          <Reports clients={clients} />
        );
      case 'settings':
        return (
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">הגדרות</h2>
            <p className="text-gray-600">בקרוב...</p>
          </div>
        );
      default:
        return <AgentDashboard user={user} clients={clients} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={logout} />
      
      <div className="flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} user={user} />
        
        <main className="flex-1 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;