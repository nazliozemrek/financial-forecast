import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ForecastTab from './tabs/ForecastTab';
import AddEventTab from './tabs/AddEventTab';
import ActiveEventsTab from './tabs/ActiveEventsTab';
import BottomTabs from './components/layout/BottomTabs';
import './index.css';

const App = () => (
  <AuthProvider>
    <Router>
      <div className="min-h-screen bg-black text-white pb-20">
        <Routes>
          <Route path="/" element={<Navigate to="/forecast" />} />
          <Route path="/forecast" element={<ForecastTab />} />
          <Route path="/add" element={<AddEventTab />} />
          <Route path="/active" element={<ActiveEventsTab />} />
        </Routes>
        <BottomTabs />
      </div>
    </Router>
  </AuthProvider>
);

export default App;