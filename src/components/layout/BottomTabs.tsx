import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { CalendarDays, PlusCircle, Save, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BottomTabs = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;

  // Don't render bottom tabs if user is not logged in
  if (!user) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0f0f0f] border-t border-[#333] shadow-lg">
      <div className="flex justify-around items-center p-2">
        <NavLink to="/forecast" className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
          isActive('/forecast')
            ? 'bg-[#007a33] text-white shadow-lg'
            : 'text-white hover:text-white hover:bg-[#1a1a1a]'
        }`}>
          <CalendarDays className={`w-5 h-5 mb-1 ${
            isActive('/forecast') ? 'text-white' : 'text-gray-300'
          }`} />
          <span className="text-xs font-medium">Calendar</span>
        </NavLink>
        
        <NavLink to="/add" className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
          isActive('/add')
            ? 'bg-[#007a33] text-white shadow-lg'
            : 'text-white hover:text-white hover:bg-[#1a1a1a]'
        }`}>
          <PlusCircle className={`w-5 h-5 mb-1 ${
            isActive('/add') ? 'text-white' : 'text-gray-300'
          }`} />
          <span className="text-xs font-medium">Add</span>
        </NavLink>
        
        <NavLink to="/active" className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
          isActive('/active')
            ? 'bg-[#007a33] text-white shadow-lg'
            : 'text-white hover:text-white hover:bg-[#1a1a1a]'
        }`}>
          <Save className={`w-5 h-5 mb-1 ${
            isActive('/active') ? 'text-white' : 'text-gray-300'
          }`} />
          <span className="text-xs font-medium">Scenarios</span>
        </NavLink>

        <NavLink to="/profile" className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
          isActive('/profile')
            ? 'bg-[#007a33] text-white shadow-lg'
            : 'text-white hover:text-white hover:bg-[#1a1a1a]'
        }`}>
          <User className={`w-5 h-5 mb-1 ${
            isActive('/profile') ? 'text-white' : 'text-gray-300'
          }`} />
          <span className="text-xs font-medium">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomTabs;