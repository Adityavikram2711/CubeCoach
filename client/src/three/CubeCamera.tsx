import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { forwardRef, useImperativeHandle, useRef } from "react";

export interface CubeCameraHandle {
  /** Resets only the camera/orbit view -- never touches the cube's logical state. */
  resetView: () => void;
}

const DEFAULT_POSITION: [number, number, number] = [4.2, 3.6, 5];

export const CubeCamera = forwardRef<CubeCameraHandle>((_props, ref) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useImperativeHandle(ref, () => ({
    resetView: () => {
      controlsRef.current?.reset();
    },
  }));

  return (
    <>
      <PerspectiveCamera makeDefault position={DEFAULT_POSITION} fov={45} />
      <OrbitControls
        ref={controlsRef}
        target={[0, 0, 0]}
        minDistance={3.5}
        maxDistance={11}
        enablePan={false}
        enableDamping
        dampingFactor={0.12}
      />
    </>
  );
});
CubeCamera.displayName = "CubeCamera";
