interface ScrambleDisplayProps {
  scramble: string;
}

export function ScrambleDisplay({ scramble }: ScrambleDisplayProps) {
  return (
    <p className="break-words text-center font-mono text-lg tracking-wide text-slate-200" aria-label="Scramble">
      {scramble}
    </p>
  );
}
