import type { SavedScenario } from "../types";

type SavedScenariosProps = {
  scenarios: SavedScenario[];
  onDelete: (id: string) => void;
  onLoad?: (events:EventItem[]) => void;
};

export default function SavedScenarios({ scenarios, onDelete }: SavedScenariosProps) {
  return (
    <div className="space-y-4 mt-4">
      <h2 className="text-lg font-bold">Saved Scenarios</h2>
      {scenarios.length === 0 && <p className="text-sm text-muted">No saved scenarios yet.</p>}

      {scenarios.map((scenario) => (
        <div
          key={scenario.id}
          className="rounded-lg border p-4 bg-white/10 text-white"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold">{scenario.name}</p>
              <p className="text-sm text-gray-300">
                Date: { new Date(scenario.date).toLocaleDateString(undefined,{
                    year:"numeric",
                    month:"long",
                    day:"numeric",   
                })}
                </p>
              <p className="text-sm text-gray-300">Final Balance: ${scenario.balance.toFixed(2)}</p>
              <p className="text-sm text-gray-300">Total Events: {scenario.events.length}</p>
            </div>
            <button
              className="text-red-400 hover:text-red-200 transition"
              onClick={() => onDelete(scenario.id)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}