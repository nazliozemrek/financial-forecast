import { X } from 'lucide-react';

interface ModalProps {
  onClose: () => void;
}

export function Modal({ onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg max-w-sm w-full z-10">
        <div className="p-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg border border-white/20 hover:bg-white/20 transition-all shadow-md"
            title="Close modal"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          {/* Modal content goes here */}
        </div>
      </div>
    </div>
  );
}