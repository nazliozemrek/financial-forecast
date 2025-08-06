import React from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarDays, PlusCircle, ListTodo } from 'lucide-react';

const BottomTabs = () => {
  return (
    <nav className="fixed bottom-0 w-full bg-black border-t border-white/10 text-white flex justify-around py-3 z-50">
      <NavLink to="/forecast" className={({ isActive }) =>
        `flex flex-col items-center text-xs ${isActive ? 'text-blue-400' : 'text-white/70'}`
      }>
        <CalendarDays size={24} />
        <span>Calendar</span>
      </NavLink>

      <NavLink to="/add" className={({ isActive }) =>
        `flex flex-col items-center text-xs ${isActive ? 'text-green-400' : 'text-white/70'}`
      }>
        <PlusCircle size={28} />
        <span>Add</span>
      </NavLink>

      <NavLink to="/active" className={({ isActive }) =>
        `flex flex-col items-center text-xs ${isActive ? 'text-yellow-400' : 'text-white/70'}`
      }>
        <ListTodo size={24} />
        <span>Active</span>
      </NavLink>
    </nav>
  );
};

export default BottomTabs;