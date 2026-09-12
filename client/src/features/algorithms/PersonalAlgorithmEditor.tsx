/**
 * Lets a signed-in user type a preferred algorithm for a case. Client-side validation
 * (via the SAME shared parser the server uses) gives instant feedback, but the server
 * always re-validates independently -- this component never assumes its own check is
 * sufficient.
 */
import { parseAlgorithm } from "@cube-coach/cube-engine";
import { useState } from "react";

interface PersonalAlgorithmEditorProps {
  officialAlgorithm: string;
  currentValue?: string;
  onSave: (value: string) => Promise<unknown>;
  onReset: () => Promise<unknown>;
  isSaving?: boolean;
}

function isValidNotation(value: string): boolean {
  if (value.trim().length === 0) return false;
  try {
    parseAlgorithm(value);
    return true;
  } catch {
    return false;
  }
}

export function PersonalAlgorithmEditor({ officialAlgorithm, currentValue, onSave, onReset, isSaving }: PersonalAlgorithmEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentValue ?? officialAlgorithm);
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setDraft(currentValue ?? officialAlgorithm);
    setError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!isValidNotation(draft)) {
      setError("Not a valid move sequence -- use standard notation like \"R U R' U'\".");
      return;
    }
    setError(null);
    await onSave(draft.trim());
    setEditing(false);
  };

  const handleCancel = () => {
    setError(null);
    setEditing(false);
  };

  const handleReset = async () => {
    setError(null);
    await onReset();
    setDraft(officialAlgorithm);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="flex flex-col gap-2">
        {currentValue ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-400">Your Personal Algorithm</span>
            <code className="rounded bg-slate-950 px-2 py-1 font-mono text-sm text-amber-200">{currentValue}</code>
          </div>
        ) : (
          <p className="text-sm text-slate-500">You haven't set a personal algorithm for this case.</p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={startEditing}
            className="self-start rounded-md border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:border-slate-500"
          >
            {currentValue ? "Edit" : "Add a personal algorithm"}
          </button>
          {currentValue && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="self-start rounded-md border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-400 hover:border-slate-500 disabled:opacity-60"
            >
              Reset to official
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="personal-algorithm-input" className="text-xs font-semibold uppercase tracking-wide text-amber-400">
        Your Personal Algorithm
      </label>
      <input
        id="personal-algorithm-input"
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
        aria-invalid={error !== null}
        aria-describedby={error ? "personal-algorithm-error" : undefined}
      />
      {error && (
        <p id="personal-algorithm-error" role="alert" className="text-sm text-rose-400">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={handleCancel} className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500">
          Cancel
        </button>
      </div>
    </div>
  );
}
