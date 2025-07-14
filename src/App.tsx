import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import { useClients } from './hooks/useClients';
import { useUserPreferences } from './hooks/useUserPreferences';
import { LoginForm } from './components/Auth/LoginForm';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { AgentDashboard } from './components/Agent/AgentDashboard';
import { ClientManagement } from './components/Agent/ClientManagement';
import { GoalsAndBonuses } from './components/Agent/GoalsAndBonuses';
import { Reports } from './components/Agent/Reports';
import { TeamManagerDashboard } from './components/Manager/TeamManagerDashboard';
import { AgentManagement } from './components/Manager/AgentManagement';
import { PageLoader } from './components/UI/PageLoader';
import { UserDebug } from './components/Debug/UserDebug';


function App() {
  const { user, loading, login, logout, createUser, getTeamMembers } = useAuth();
  const { clients, addClient, updateClient, deleteClient } = useClients(user?.id || '', user?.teamId || '', user?.name || '');
  const { preferences, setLastActiveTab } = useUserPreferences(user?.id || '');
  const [showLoader, setShowLoader] = useState(true);
  
  // Get active tab from user preferences or default
  const activeTab = preferences?.lastActiveTab || (user?.role === 'manager' ? 'manager-dashboard' : 'dashboard');
  
  // Update activeTab handler - saves to Firebase preferences
  const setActiveTab = (tab: string) => {
    setLastActiveTab(tab);
  };

  // Handle smooth loader exit
  useEffect(() => {
    if (!loading) {
      // Add a small delay for smooth transition
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Set default tab when user changes and no preferences exist yet
  useEffect(() => {
    if (user && preferences && !preferences.lastActiveTab) {
      const defaultTab = user.role === 'manager' ? 'manager-dashboard' : 'dashboard';
      console.log('📍 Setting default active tab to:', defaultTab);
      setActiveTab(defaultTab);
    }
  }, [user, preferences]);

  // Show beautiful page loader during initial loading
  if (loading || showLoader) {
    return (
      <AnimatePresence>
        <motion.div
          key="page-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            scale: 1.1,
            transition: { duration: 0.6, ease: "easeInOut" }
          }}
        >
          <PageLoader />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!user) {
    return (
      <AnimatePresence>
        <motion.div
          key="login-form"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <LoginForm onLogin={login} />
        </motion.div>
      </AnimatePresence>
    );
  }

  const renderContent = () => {
    // Manager routes
    if (user.role === 'manager') {
      switch (activeTab) {
        // Team Management
        case 'manager-dashboard':
          return <TeamManagerDashboard user={user} onTabChange={setActiveTab} />;
        case 'agent-management':
          return <AgentManagement user={user} />;
        case 'team-reports':
          return (
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">דוחות צוות</h2>
              <p className="text-gray-600">בקרוב...</p>
            </div>
          );
        
        // Personal Selling (Manager as Agent)
        case 'my-clients':
          return (
            <ClientManagement
              clients={clients}
              user={user}
              onAddClient={addClient}
              onUpdateClient={updateClient}
              onDeleteClient={deleteClient}
            />
          );
        case 'my-goals':
          return (
            <GoalsAndBonuses clients={clients} />
          );
        case 'my-reports':
          return (
            <Reports clients={clients} user={user} />
          );
        
        case 'settings':
          return (
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">הגדרות</h2>
              <p className="text-gray-600">בקרוב...</p>
            </div>
          );
        case 'debug':
          return <UserDebug />;
        default:
          return <TeamManagerDashboard user={user} onTabChange={setActiveTab} />;
      }
    }

    // Agent routes
    switch (activeTab) {
      case 'dashboard':
        return <AgentDashboard user={user} clients={clients} onTabChange={setActiveTab} />;
      case 'clients':
        return (
          <ClientManagement
            clients={clients}
            user={user}
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
          <Reports clients={clients} user={user} />
        );
      case 'settings':
        return (
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">הגדרות</h2>
            <p className="text-gray-600">בקרוב...</p>
          </div>
        );
      default:
        return <AgentDashboard user={user} clients={clients} onTabChange={setActiveTab} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen bg-gray-50"
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Header user={user} onLogout={logout} />
      </motion.div>
      
      <div className="flex">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} user={user} />
        </motion.div>
        
        <motion.main 
          className="flex-1 p-6"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
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
        </motion.main>
      </div>
      

    </motion.div>
  );
}

export default App;