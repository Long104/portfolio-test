import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

// Subtle camera tilt that follows the mouse.
// Max offset is ~0.08 units (~1° at FOV 75) — barely perceptible
// as movement but gives the scene a "physical" weight.
export default function MouseTilt() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame(() => {
    // target offset from center: ±0.08 in x and y
    const tx = mouse.current.x * 0.08;
    const ty = mouse.current.y * 0.08;

    // lerp camera toward target — drifts back to [0,0,5] when mouse centers
    camera.position.x += (tx - camera.position.x) * 0.03;
    camera.position.y += (ty - camera.position.y) * 0.03;
    camera.position.z += (5 - camera.position.z) * 0.03;

    camera.lookAt(0, 0, 0);
  });

  return null;
}
