import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import HeroMesh from './HeroMesh.jsx';

/**
 * ThreeDCanvas — R3F Canvas pinned fixed to the viewport.
 * Position: fixed; z-index: 0 — HTML content scrolls above it.
 *
 * Camera: FOV 75°, near 0.1, far 1000, position [0, 0, 5]
 * Lighting: Ambient + DirectionalLight (0xffffff)
 */
const ThreeDCanvas = React.forwardRef(function ThreeDCanvas(_props, meshRef) {
    return (
        <div className="canvas-wrapper">
            <Canvas
                camera={{
                    fov: 75,
                    near: 0.1,
                    far: 1000,
                    position: [0, 0, 5],
                    aspect: window.innerWidth / window.innerHeight,
                }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
                dpr={[1, 2]}
            >
                {/* ── Illumination Layer ── */}
                <ambientLight intensity={0.4} />
                <directionalLight
                    color={0xffffff}
                    intensity={1.8}
                    position={[5, 8, 5]}
                    castShadow
                />
                <directionalLight
                    color={0x6366f1}
                    intensity={0.6}
                    position={[-5, -4, -3]}
                />

                {/* ── Hero Mesh — ref forwarded for GSAP ── */}
                <HeroMesh ref={meshRef} />
            </Canvas>
        </div>
    );
});

export default ThreeDCanvas;
