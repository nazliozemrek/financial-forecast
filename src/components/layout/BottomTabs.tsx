import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { CalendarDays, PlusCircle, Save, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const BottomTabs = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      setShowProfileMenu(false);
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  // Don't render bottom tabs if user is not logged in
  if (!user) {
    return null;
  }

  return (
    <>
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

          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
              showProfileMenu
                ? 'bg-[#007a33] text-white shadow-lg'
                : 'text-white hover:text-white hover:bg-[#1a1a1a]'
            }`}
          >
            <User className={`w-5 h-5 mb-1 ${
              showProfileMenu ? 'text-white' : 'text-gray-300'
            }`} />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>

      {/* Profile Menu */}
      {showProfileMenu && (
        <div className="fixed bottom-20 right-4 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50">
          <div className="p-2">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-white hover:bg-[#2a2a2a] rounded-lg transition-all duration-200"
            >
              <LogOut className="w-4 h-4 mr-3" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Backdrop to close menu */}
      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </>
  );
};

export default BottomTabs;