import React, { useState } from 'react';
import EventModal from '../components/modals/EventModal';

const AddEventTab = () => {
  const [isOpen, setIsOpen] = useState(true); // auto-open

  return (
    <div className="p-4 text-white">
      <h2 className="text-xl font-bold mb-4">➕ Add Event</h2>
      <EventModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSave={(event) => {
          // TODO: Save event to Firestore or context
          setIsOpen(false);
        }}
      />
    </div>
  );
};

export default AddEventTab;