import { Calendar, Plus, ChevronLeft, ChevronRight, UserCircle, Target } from 'lucide-react';
import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebase/config';

interface HeaderProps {
  onAddEvent: () => void;
  onQuickSim: () => void;
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  extraButtons?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  onQuickSim,
  currentDate,
  onPrevMonth,
  onNextMonth,
  extraButtons,
}) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const user = auth.currentUser;

  const HeaderButton = ({ label, icon: Icon, color, onClick }: { label: string; icon: React.ElementType; color: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg ${color} text-white font-medium hover:scale-105 transition-all duration-200 shadow-md`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-50 bg-[#0f0f0f] border-b border-[#333] shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-7 gap-1 p-2 md:p-3">
          {/* Left arrow - aligns with Sun column */}
          <div className="flex items-center justify-start">
            <button
              onClick={onPrevMonth}
              className="p-1.5 md:p-2 rounded-lg bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] transition-all duration-200 border border-[#333] text-sm"
            >
              ←
            </button>
          </div>

          {/* Month display - spans Mon and Tue columns */}
          <div className="col-span-2 flex items-center justify-center">
            <span className="px-2 md:px-3 py-1.5 md:py-2 text-white font-semibold bg-[#1a1a1a] rounded-lg border border-[#333] text-sm md:text-base text-center">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          {/* Right arrow - aligns with Wed column */}
          <div className="flex items-center justify-end">
            <button
              onClick={onNextMonth}
              className="p-1.5 md:p-2 rounded-lg bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] transition-all duration-200 border border-[#333] text-sm"
            >
              →
            </button>
          </div>

          {/* Action buttons - span Thu, Fri, Sat columns */}
          <div className="col-span-3 flex items-center justify-center space-x-1 md:space-x-2">
            {extraButtons}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;