import React from 'react';
import EventSummary from '../components/simulation/EventSummary';

const ActiveEventsTab = () => {
  // TODO: Pull events from context or props
  return (
    <div className="p-4 text-white">
      <h2 className="text-xl font-bold mb-4">📋 Active Events</h2>
      <EventSummary
        events={[]}  // Populate this later
        onDelete={() => {}}
        onToggleRecurring={() => {}}
        onEdit={() => {}}
      />
    </div>
  );
};

export default ActiveEventsTab;