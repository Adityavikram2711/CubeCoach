/**
 * The 3D cube renderer. This component owns NO logical cube state of its own -- it
 * always displays exactly the `cube` prop it's given, using the shared engine's own
 * facelet geometry to place every sticker. The only cube-engine calls it makes
 * (applyMove/applyAlgorithm) are the same pure functions every other part of the app
 * uses, purely to know what the *next* state will look like so it can animate smoothly
 * toward it -- it never invents its own notion of what a move does.
 *
 * Architecture: `displayCube` is the state currently rendered at rest. `playMove`
 * computes `next = applyMove(displayCube, move)` via the shared engine, then spins a
 * pivot group (containing only the affected cubies, rendered with the *pre-move*
 * colors) from 0 to the move's angle. When the animation finishes, the pivot resets to
 * 0 and `displayCube` snaps to `next` in the same tick -- the two are geometrically
 * identical at that instant, so there's no visible pop. `onCubeChange` lets the parent
 * mirror the same authoritative state into its own store.
 */
import { Canvas, useFrame } from "@react-three/fiber";
import { applyMove, parseAlgorithm, type FaceletCube, type Move } from "@cube-coach/cube-engine";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as THREE from "three";
import { MoveQueue } from "./animationQueue.js";
import { ALL_CUBIE_POSITIONS } from "./cubieLayout.js";
import { Cubie } from "./Cubie.js";
import { CubeCamera, type CubeCameraHandle } from "./CubeCamera.js";
import { planMoveAnimation, type MoveAnimationPlan } from "./moveAnimation.js";

export type AnimationSpeed = "slow" | "normal" | "fast";

/** Milliseconds for a single quarter turn at each speed. */
const QUARTER_TURN_DURATION_MS: Record<AnimationSpeed, number> = {
  slow: 500,
  normal: 260,
  fast: 130,
};

export interface Cube3DHandle {
  playMove: (move: Move) => void;
  playAlgorithm: (source: string | Move[]) => void;
  clearQueue: () => void;
  /**
   * Drops any queued-but-not-yet-started moves, but -- unlike clearQueue -- lets a
   * move already mid-animation finish landing cleanly first. For a "Pause" control:
   * clearQueue's immediate cancel would freeze the cube mid-rotation at an arbitrary
   * angle that doesn't correspond to any move boundary; this always leaves the cube at
   * a clean, fully-turned position.
   */
  stopAfterCurrentMove: () => void;
  resetView: () => void;
  isAnimating: () => boolean;
}

export interface Cube3DProps {
  cube: FaceletCube;
  animationSpeed?: AnimationSpeed;
  onCubeChange?: (cube: FaceletCube) => void;
  onAnimationComplete?: () => void;
  className?: string;
}

interface ActiveAnimation {
  /**
   * A unique id per animation, used as SpinningLayer's React key. React's automatic
   * batching can collapse `setAnimation(null)` immediately followed by
   * `setAnimation(nextAnimation)` (which happens whenever the queue auto-chains into
   * the next move from inside the previous move's completion handler) into a single
   * prop update on the SAME component instance -- the intermediate `null` never
   * actually commits. Without a changing key, SpinningLayer would never remount, so
   * its `doneRef`/`elapsedMsRef` (and the THREE.Group's leftover rotation) would carry
   * over stale from the previous move, silently freezing the queue after move 1 of any
   * auto-chained sequence. Forcing a fresh key per animation guarantees a fresh mount.
   */
  id: number;
  plan: MoveAnimationPlan;
  fromCube: FaceletCube;
  toCube: FaceletCube;
  durationMs: number;
}

function SpinningLayer({
  animation,
  onDone,
}: {
  animation: ActiveAnimation;
  onDone: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const elapsedMsRef = useRef(0);
  const doneRef = useRef(false);
  const axisVector = new THREE.Vector3(...animation.plan.axis);

  useFrame((_state, deltaSeconds) => {
    if (doneRef.current) return;
    elapsedMsRef.current += deltaSeconds * 1000;
    const t = Math.min(1, elapsedMsRef.current / animation.durationMs);
    const eased = 1 - (1 - t) * (1 - t); // ease-out: fast start, gentle settle
    if (groupRef.current) {
      groupRef.current.setRotationFromAxisAngle(axisVector, animation.plan.angle * eased);
    }
    if (t >= 1) {
      doneRef.current = true;
      onDone();
    }
  });

  const layerPositions = ALL_CUBIE_POSITIONS.filter((p) => animation.plan.inLayer(p));

  return (
    <group ref={groupRef}>
      {layerPositions.map((position) => (
        <Cubie key={position.join(",")} position={position} cube={animation.fromCube} />
      ))}
    </group>
  );
}

function CubeScene({
  displayCube,
  animation,
  onAnimationDone,
}: {
  displayCube: FaceletCube;
  animation: ActiveAnimation | null;
  onAnimationDone: () => void;
}) {
  const staticPositions = animation
    ? ALL_CUBIE_POSITIONS.filter((p) => !animation.plan.inLayer(p))
    : ALL_CUBIE_POSITIONS;
  const staticCube = animation ? animation.toCube : displayCube;

  return (
    <group>
      {/* Solid core so the cube doesn't look hollow through the gaps between cubies. */}
      <mesh>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color="#050505" />
      </mesh>
      {staticPositions.map((position) => (
        <Cubie key={position.join(",")} position={position} cube={staticCube} />
      ))}
      {animation && <SpinningLayer key={animation.id} animation={animation} onDone={onAnimationDone} />}
      <ambientLight intensity={0.65} />
      <directionalLight position={[5, 8, 6]} intensity={0.9} />
      <directionalLight position={[-5, -3, -4]} intensity={0.25} />
    </group>
  );
}

export const Cube3D = forwardRef<Cube3DHandle, Cube3DProps>(
  ({ cube, animationSpeed = "normal", onCubeChange, onAnimationComplete, className }, ref) => {
    const [displayCube, setDisplayCube] = useState<FaceletCube>(cube);
    const [animation, setAnimation] = useState<ActiveAnimation | null>(null);
    const queueRef = useRef(new MoveQueue());
    const cameraRef = useRef<CubeCameraHandle>(null);
    const displayCubeRef = useRef(displayCube);
    displayCubeRef.current = displayCube;
    const animationSpeedRef = useRef(animationSpeed);
    animationSpeedRef.current = animationSpeed;
    const animatingRef = useRef(false);
    const nextAnimationIdRef = useRef(0);

    // Only external, non-animated jumps (Reset, loading a saved solve, etc.) sync here.
    // A prop change that arrives mid-animation is intentionally ignored until the
    // current animation finishes, to avoid fighting an in-flight rotation.
    useEffect(() => {
      if (!animatingRef.current) setDisplayCube(cube);
    }, [cube]);

    const runNext = () => {
      const next = queueRef.current.dequeue();
      if (!next) {
        animatingRef.current = false;
        return;
      }
      const fromCube = displayCubeRef.current;
      const toCube = applyMove(fromCube, next);
      const plan = planMoveAnimation(next);
      animatingRef.current = true;
      nextAnimationIdRef.current += 1;
      setAnimation({
        id: nextAnimationIdRef.current,
        plan,
        fromCube,
        toCube,
        durationMs: QUARTER_TURN_DURATION_MS[animationSpeedRef.current],
      });
    };

    const handleAnimationDone = () => {
      const finished = animation;
      setAnimation(null);
      if (finished) {
        setDisplayCube(finished.toCube);
        displayCubeRef.current = finished.toCube;
        onCubeChange?.(finished.toCube);
      }
      onAnimationComplete?.();
      if (queueRef.current.isEmpty) {
        animatingRef.current = false;
      } else {
        runNext();
      }
    };

    useImperativeHandle(ref, () => ({
      playMove: (move: Move) => {
        queueRef.current.enqueue(move);
        if (!animatingRef.current) runNext();
      },
      playAlgorithm: (source: string | Move[]) => {
        const moves = Array.isArray(source) ? source : parseAlgorithm(source);
        queueRef.current.enqueue(...moves);
        if (!animatingRef.current) runNext();
      },
      clearQueue: () => {
        queueRef.current.clear();
        animatingRef.current = false;
        setAnimation(null);
      },
      stopAfterCurrentMove: () => {
        queueRef.current.clear();
      },
      resetView: () => cameraRef.current?.resetView(),
      isAnimating: () => animatingRef.current,
    }));

    return (
      <div className={className} style={{ width: "100%", height: "100%" }}>
        <Canvas shadows dpr={[1, 2]}>
          <CubeCamera ref={cameraRef} />
          <CubeScene displayCube={displayCube} animation={animation} onAnimationDone={handleAnimationDone} />
        </Canvas>
      </div>
    );
  },
);
Cube3D.displayName = "Cube3D";
