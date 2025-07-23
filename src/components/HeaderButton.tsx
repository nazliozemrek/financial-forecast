// src/components/HeaderButton.tsx
import React from 'react';
import  type { ComponentType } from 'react';

interface HeaderButtonProps {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  color?: string; // e.g., 'bg-green-600'
}

const HeaderButton: React.FC<HeaderButtonProps> = ({ label, icon: Icon, onClick, color = 'bg-slate-600' }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-white rounded-lg hover:opacity-90 flex items-center gap-2 ${color}`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
};

export default HeaderButton;