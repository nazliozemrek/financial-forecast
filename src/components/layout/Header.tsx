import { Calendar, Plus, ChevronLeft, ChevronRight, UserCircle } from 'lucide-react';
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
  onAddEvent,
  onQuickSim,
  currentDate,
  onPrevMonth,
  onNextMonth,
  extraButtons,
}) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const user = auth.currentUser;

  return (
    <>
      {/* HEADER */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 mb-6">
        <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between w-full">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <span className="text-4xl font-bold text-white drop-shadow-md font-sans">
                Financial Forecast
              </span>
            </h1>
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-full hover:bg-white/10 transition"
            >
              <UserCircle className="w-7 h-7 text-white" />
            </button>
          </div>

          <div className="grid grid-cols-3 sm:flex gap-3 justify-end sm:justify-start w-full sm:w-auto">
            <button
              onClick={onQuickSim}
              className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg border border-white/20 hover:bg-white/20 hover:shadow-lg hover:scale-105 transition-all shadow-md"
            >
              Visual Forecast
            </button>

            {extraButtons}

            <button
              onClick={onAddEvent}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-green-500/25 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Event
            </button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={onPrevMonth}
            className="p-3 hover:bg-white/20 rounded-xl transition-all duration-200 text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-white">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={onNextMonth}
            className="p-3 hover:bg-white/20 rounded-xl transition-all duration-200 text-white"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* BACKDROP */}
      {isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setDrawerOpen(false)}
          />
          {/* DRAWER */}
          <div className="fixed top-0 right-0 z-50 h-full w-64 bg-gray-900 text-white p-6 shadow-xl rounded-l-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Your Profile</h2>
                <button onClick={() => setDrawerOpen(false)} className="text-xl">
                  &times;
                </button>
              </div>

              {user ? (
                <div className="space-y-4">
                  <p className="text-sm opacity-80">Email: {user.email}</p>
                  <button className="w-full py-2 bg-white/10 rounded hover:bg-white/20">
                    Settings
                  </button>
                </div>
              ) : (
                <p>Not signed in.</p>
              )}
            </div>

            <button
              className="w-full py-2 bg-red-600 rounded hover:bg-red-700"
              onClick={() => {
                signOut(auth);
                setDrawerOpen(false);
                window.location.reload();
              }}
            >
              Log Out
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default Header;