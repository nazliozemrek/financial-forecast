import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ForecastTab from './tabs/ForecastTab';
import AddEventTab from './tabs/AddEventTab';
import ActiveEventsTab from './tabs/ActiveEventsTab';
import BottomTabs from './components/layout/BottomTabs';
import Login from './pages/Login';
import './index.css';

// Layout component that includes BottomTabs
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-black text-white pb-20">
    {children}
    <BottomTabs />
  </div>
);

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>;
  }
  
  if (!user) {
    return <Login />;
  }
  
  return <Layout>{children}</Layout>;
};

const App = () => (
  <AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/forecast" />} />
        <Route path="/forecast" element={
          <ProtectedRoute>
            <ForecastTab />
          </ProtectedRoute>
        } />
        <Route path="/add" element={
          <ProtectedRoute>
            <AddEventTab />
          </ProtectedRoute>
        } />
        <Route path="/active" element={
          <ProtectedRoute>
            <ActiveEventsTab />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;