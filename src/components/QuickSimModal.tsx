import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import type { EventItem } from "../types";

interface QuickSimModalProps {
  isOpen?: boolean;
  closeModal?: () => void;
  onSubmit: () => void;
  quickSimDate: string;
  setQuickSimDate: (date: string) => void;
  initialBalance: number;
  setInitialBalance: (value: number) => void;
  skipAnimation: boolean;
  setSkipAnimation: (value: boolean) => void;
  events: EventItem[];
  onToggleEvent: (id: number) => void;
}

export default function QuickSimModal({
  isOpen = true,
  closeModal = () => {},
  onSubmit,
  quickSimDate,
  setQuickSimDate,
  initialBalance,
  setInitialBalance,
  skipAnimation,
  setSkipAnimation,
  events,
  onToggleEvent
}: QuickSimModalProps) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md rounded-xl bg-gray-800 text-white p-6 shadow-xl">
                <Dialog.Title className="text-lg font-semibold mb-4">Quick Balance Simulation</Dialog.Title>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="quickSimDate" className="text-sm font-medium">Target Date</label>
                    <input
                      id="quickSimDate"
                      type="date"
                      min={new Date().toISOString().split('T')[0]} // Prevent past dates
                      value={quickSimDate}
                      onChange={(e) => setQuickSimDate(e.target.value)}
                      className="mt-1 w-full p-2 rounded bg-gray-700 border border-white/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="initialBalance" className="text-sm font-medium">Initial Balance</label>
                    <input
                      id="initialBalance"
                      type="number"
                      value={initialBalance}
                      onChange={(e) => setInitialBalance(Number(e.target.value))}
                      className="mt-1 w-full p-2 rounded bg-gray-700 border border-white/20"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="skipAnimation"
                      checked={skipAnimation}
                      onChange={(e) => setSkipAnimation(e.target.checked)}
                    />
                    <label htmlFor="skipAnimation" className="text-sm">Skip animation and show results instantly</label>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mt-4 mb-2">Toggle Events:</h3>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {events.map((event) => (
                        <div key={event.id} className="flex items-center justify-between bg-gray-700 px-3 py-2 rounded">
                          <span className="text-sm truncate">{event.title}</span>
                          <input
                            type="checkbox"
                            checked={event.enabled !== false}
                            onChange={() => onToggleEvent(event.id)}
                            className="h-4 w-4"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-sm"
                    >
                      Close
                    </button>
                    <button
                      onClick={onSubmit}
                      className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-sm font-semibold"
                    >
                      Simulate
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}