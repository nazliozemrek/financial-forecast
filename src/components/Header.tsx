import { on } from 'events';
import { Calendar,Plus,ChevronLeft,ChevronRight } from 'lucide-react';

const Header = ({ onAddEvent,onQuickSim, currentDate, onPrevMonth, onNextMonth }) => {

    return (    
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              Financial Forecast
            </h1>
            <div className="flex gap-3">
              <button
                onClick={onQuickSim}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-blue-500/25"
              >
                Quick Sim
              </button>
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
          <div className="flex items-center justify-between">
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
    );  
};

export default Header;