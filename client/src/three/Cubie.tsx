import { RoundedBox } from "@react-three/drei";
import { FACE_NORMAL, faceletIndexAt, type FaceletCube, type Vec3 } from "@cube-coach/cube-engine";
import { hasStickerAt } from "./cubieLayout.js";
import { CUBIE_BODY_COLOR, CUBIE_GAP, CUBIE_SIZE, STICKER_COLOR, STICKER_OFFSET } from "./materials.js";
import { Sticker } from "./Sticker.js";

const NORMALS = Object.values(FACE_NORMAL);

interface CubieProps {
  /** Logical engine position (each coordinate in {-1,0,1}) -- NOT a world-space position. */
  position: Vec3;
  cube: FaceletCube;
}

export function Cubie({ position, cube }: CubieProps) {
  const worldPosition: [number, number, number] = [
    position[0] * CUBIE_GAP,
    position[1] * CUBIE_GAP,
    position[2] * CUBIE_GAP,
  ];

  return (
    <group>
      <RoundedBox args={[CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE]} radius={0.06} smoothness={2} position={worldPosition}>
        <meshStandardMaterial color={CUBIE_BODY_COLOR} roughness={0.6} metalness={0.1} />
      </RoundedBox>
      {NORMALS.filter((normal) => hasStickerAt(position, normal)).map((normal) => {
        const color = cube[faceletIndexAt(position, normal)]!;
        return (
          <Sticker
            key={normal.join(",")}
            cubieCenter={worldPosition}
            normal={normal}
            offset={STICKER_OFFSET}
            color={STICKER_COLOR[color]}
          />
        );
      })}
    </group>
  );
}
