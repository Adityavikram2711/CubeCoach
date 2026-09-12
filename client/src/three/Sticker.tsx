import { STICKER_SIZE, STICKER_THICKNESS } from "./materials.js";

/** Euler rotation that turns a plane's default +Z normal to face the given axis-aligned unit normal. */
function eulerForNormal(normal: readonly [number, number, number]): [number, number, number] {
  const [x, y, z] = normal;
  if (x === 1) return [0, Math.PI / 2, 0];
  if (x === -1) return [0, -Math.PI / 2, 0];
  if (y === 1) return [-Math.PI / 2, 0, 0];
  if (y === -1) return [Math.PI / 2, 0, 0];
  if (z === 1) return [0, 0, 0];
  return [0, Math.PI, 0]; // z === -1
}

interface StickerProps {
  /** World-space center of the cubie this sticker belongs to. */
  cubieCenter: readonly [number, number, number];
  normal: readonly [number, number, number];
  offset: number;
  color: string;
}

export function Sticker({ cubieCenter, normal, offset, color }: StickerProps) {
  const position: [number, number, number] = [
    cubieCenter[0] + normal[0] * offset,
    cubieCenter[1] + normal[1] * offset,
    cubieCenter[2] + normal[2] * offset,
  ];

  return (
    <mesh position={position} rotation={eulerForNormal(normal)}>
      <boxGeometry args={[STICKER_SIZE, STICKER_SIZE, STICKER_THICKNESS]} />
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.05} />
    </mesh>
  );
}
