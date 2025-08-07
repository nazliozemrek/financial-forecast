// src/components/HeaderButton.tsx
import React from 'react';
import type { LucideProps } from 'lucide-react';

interface HeaderButtonProps {
  label: string;
  icon: React.ComponentType<LucideProps>;
  color: string;
  onClick: () => void;
}

export const HeaderButton: React.FC<HeaderButtonProps> = ({ label, icon: Icon, color, onClick }) => {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200 shadow-md w-[50px] h-[50px] ${color}`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
};