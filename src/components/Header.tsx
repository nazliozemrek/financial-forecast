import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

export function Header({
  onQuickSim,
  onAddEvent,
  onPrevMonth,
  onNextMonth,
}: {
  onQuickSim: () => void;
  onAddEvent: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-800">
      <div className="flex items-center gap-4">
        <button
          onClick={onQuickSim}
          className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg border border-white/20 hover:bg-white/20 hover:shadow-lg hover:scale-105 transition-all shadow-md"
          title="Visual Forecast"
          aria-label="Visual Forecast"
        >
          Visual Forecast
        </button>
        <button
          onClick={onAddEvent}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-green-500/25 flex items-center gap-2"
          title="Add Event"
          aria-label="Add Event"
        >
          <Plus className="w-5 h-5" />
          Add Event
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevMonth}
          className="p-3 hover:bg-white/20 rounded-xl transition-all duration-200 text-white"
          title="Previous Month"
          aria-label="Previous Month"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={onNextMonth}
          className="p-3 hover:bg-white/20 rounded-xl transition-all duration-200 text-white"
          title="Next Month"
          aria-label="Next Month"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}