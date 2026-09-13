import { parseAlgorithm } from "@cube-coach/cube-engine";
import { Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PersonalAlgorithmEditor } from "./PersonalAlgorithmEditor.js";
import { useToggleFavorite, useToggleLearned, useUpsertUserAlgorithm, useUserAlgorithm } from "./useUserAlgorithm.js";

interface PersonalizationPanelProps {
  algorithmId: string;
  officialAlgorithm: string;
}

function isValidNotation(value: string): boolean {
  try {
    parseAlgorithm(value);
    return true;
  } catch {
    return false;
  }
}

export function PersonalizationPanel({ algorithmId, officialAlgorithm }: PersonalizationPanelProps) {
  const { data: record, isLoading } = useUserAlgorithm(algorithmId);
  const upsert = useUpsertUserAlgorithm(algorithmId);
  const toggleFavorite = useToggleFavorite(algorithmId);
  const toggleLearned = useToggleLearned(algorithmId);

  const [notesDraft, setNotesDraft] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [newAlternative, setNewAlternative] = useState("");
  const [alternativeError, setAlternativeError] = useState<string | null>(null);

  useEffect(() => {
    if (!notesDirty) setNotesDraft(record?.notes ?? "");
  }, [record?.notes, notesDirty]);

  if (isLoading) {
    return <p className="cc-status-line">Loading your personalization...</p>;
  }

  const alternatives = record?.personalAlternatives ?? [];

  const handleSaveNotes = async () => {
    await upsert.mutateAsync({ notes: notesDraft });
    setNotesDirty(false);
  };

  const handleAddAlternative = async () => {
    if (!isValidNotation(newAlternative)) {
      setAlternativeError("Not a valid move sequence.");
      return;
    }
    setAlternativeError(null);
    await upsert.mutateAsync({ personalAlternatives: [...alternatives, newAlternative.trim()] });
    setNewAlternative("");
  };

  const handleRemoveAlternative = async (index: number) => {
    await upsert.mutateAsync({ personalAlternatives: alternatives.filter((_, i) => i !== index) });
  };

  return (
    <section className="cc-card flex flex-col gap-5 p-4" style={{ borderColor: "rgba(180, 83, 9, 0.4)" }} aria-label="Your personalization">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => toggleFavorite.mutate()}
          aria-pressed={record?.favorite ?? false}
          className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            record?.favorite
              ? "border-amber-500 bg-amber-950/50 text-amber-300"
              : "border-slate-700 text-slate-300 hover:border-slate-500"
          }`}
        >
          <Star size={16} fill={record?.favorite ? "currentColor" : "none"} />
          {record?.favorite ? "Favorited" : "Favorite"}
        </button>

        <button
          type="button"
          onClick={() => toggleLearned.mutate()}
          aria-pressed={record?.learned ?? false}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            record?.learned
              ? "border-emerald-600 bg-emerald-950/50 text-emerald-300"
              : "border-slate-700 text-slate-300 hover:border-slate-500"
          }`}
        >
          {record?.learned ? "Learned" : "Mark as learned"}
        </button>
      </div>

      <div>
        <PersonalAlgorithmEditor
          officialAlgorithm={officialAlgorithm}
          currentValue={record?.preferredAlgorithm}
          isSaving={upsert.isPending}
          onSave={(value) => upsert.mutateAsync({ preferredAlgorithm: value })}
          onReset={() => upsert.mutateAsync({ preferredAlgorithm: null })}
        />
        <p className="mt-1 text-xs text-slate-500">This is your own variation -- not a CubeCoach-verified algorithm.</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Personal Alternatives</h3>
        {alternatives.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1.5">
            {alternatives.map((alt, i) => (
              <li key={i} className="flex items-center justify-between gap-2 rounded bg-slate-950 px-2 py-1.5">
                <code className="font-mono text-sm text-slate-200">{alt}</code>
                <button
                  type="button"
                  onClick={() => handleRemoveAlternative(i)}
                  aria-label={`Remove alternative ${alt}`}
                  className="text-slate-500 hover:text-rose-400"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newAlternative}
            onChange={(e) => setNewAlternative(e.target.value)}
            placeholder="Add another algorithm you use..."
            aria-label="Add a personal alternative algorithm"
            className="cc-input flex-1 px-3 py-1.5 font-mono"
          />
          <button
            type="button"
            onClick={handleAddAlternative}
            className="cc-btn-secondary px-3 py-1.5"
          >
            Add
          </button>
        </div>
        {alternativeError && (
          <p role="alert" className="mt-1 text-sm text-rose-400">
            {alternativeError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="personal-notes" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Notes
        </label>
        <textarea
          id="personal-notes"
          value={notesDraft}
          onChange={(e) => {
            setNotesDraft(e.target.value);
            setNotesDirty(true);
          }}
          rows={3}
          placeholder="e.g. Use left-hand grip, still slow on the regrip..."
          className="cc-input mt-1"
        />
        {notesDirty && (
          <button
            type="button"
            onClick={handleSaveNotes}
            disabled={upsert.isPending}
            className="mt-2 cc-btn-primary px-3 py-1.5"
          >
            Save Notes
          </button>
        )}
      </div>
    </section>
  );
}
