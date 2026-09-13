import { COLORS, type Color, type ValidationResult } from "@cube-coach/cube-engine";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { STICKER_COLOR } from "../../three/materials.js";

const COLOR_LABEL: Record<Color, string> = {
  white: "White",
  yellow: "Yellow",
  red: "Red",
  orange: "Orange",
  blue: "Blue",
  green: "Green",
};

interface ValidationPanelProps {
  filledCount: number;
  totalEditable: number;
  colorCounts: Record<Color, number>;
  validation: ValidationResult | null;
  onValidate: () => void;
  onSolve: () => void;
}

const buttonClass = "cc-btn-secondary px-3 py-1.5";

export function ValidationPanel({
  filledCount,
  totalEditable,
  colorCounts,
  validation,
  onValidate,
  onSolve,
}: ValidationPanelProps) {
  const complete = filledCount === totalEditable;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-slate-300">
          <span className="font-semibold text-slate-100">
            {filledCount} / {totalEditable}
          </span>{" "}
          stickers entered
        </p>
        <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          {COLORS.map((color) => {
            const count = colorCounts[color];
            const off = count !== 9;
            return (
              <div
                key={color}
                className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${
                  off ? "border-amber-600/50 text-amber-400" : "border-slate-700 text-slate-300"
                }`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full border border-black/30"
                  style={{ backgroundColor: STICKER_COLOR[color] }}
                />
                {COLOR_LABEL[color]} {count}/9
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonClass} onClick={onValidate}>
          Validate Cube
        </button>
        <button type="button" className="cc-btn-primary px-3 py-1.5" onClick={onSolve} disabled={validation?.valid !== true}>
          Solve Cube
        </button>
      </div>

      <div aria-live="polite">
        {validation === null && !complete && (
          <p className="text-sm text-slate-500">Enter the cube colors, then click Validate Cube.</p>
        )}
        {validation && !validation.valid && (
          <div className="flex flex-col gap-1.5 rounded-md border border-red-900/60 bg-red-950/40 p-3 text-sm text-red-300">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={16} />
              Invalid cube configuration
            </div>
            <ul className="ml-6 list-disc">
              {validation.issues.map((issue, i) => (
                // validateCube can report the same issue code more than once (e.g. two
                // colors each with the wrong count), so the code alone isn't a unique key.
                <li key={`${issue.code}-${i}`}>{issue.message}</li>
              ))}
            </ul>
          </div>
        )}
        {validation?.valid === true && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-900/60 bg-emerald-950/40 p-3 text-sm font-medium text-emerald-300">
            <CheckCircle2 size={16} />
            Valid cube configuration
          </div>
        )}
      </div>
    </div>
  );
}
