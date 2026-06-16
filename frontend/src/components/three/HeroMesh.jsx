import React, { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * HeroMesh — Procedural TorusKnot with:
 * - Single shared MeshStandardMaterial (no per-iteration duplicates)
 * - onBeforeCompile GLSL shader injection for neon hover color shift
 * - DataTexture normal map for surface detail
 * - Mouse hover state interpolating uHover uniform
 */
const HeroMesh = React.forwardRef(function HeroMesh(props, ref) {
    const meshRef = useRef(null);
    const [hovered, setHovered] = useState(false);
    const hoverTarget = useRef(0);
    const hoverCurrent = useRef(0);

    // ── Normal Map (procedural 32×32 DataTexture) ────────────────────────────
    const normalMap = useMemo(() => {
        const size = 32;
        const data = new Uint8Array(size * size * 4);
        for (let i = 0; i < size * size; i++) {
            const x = (i % size) / size;
            const y = Math.floor(i / size) / size;
            const nx = Math.sin(x * Math.PI * 8) * 0.5 + 0.5;
            const ny = Math.cos(y * Math.PI * 8) * 0.5 + 0.5;
            data[i * 4]     = Math.floor(nx * 255);
            data[i * 4 + 1] = Math.floor(ny * 255);
            data[i * 4 + 2] = 255;
            data[i * 4 + 3] = 255;
        }
        const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(4, 4);
        tex.needsUpdate = true;
        return tex;
    }, []);

    // ── Single shared material (avoids duplicate draw calls) ─────────────────
    const material = useMemo(() => {
        const uHoverUniform = { value: 0.0 };

        const mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#6366f1'),
            metalness: 0.6,
            roughness: 0.2,
            normalMap,
            normalScale: new THREE.Vector2(1.5, 1.5),
        });

        // ── onBeforeCompile: inject custom GLSL uniforms & shader code ────────
        mat.onBeforeCompile = (shader) => {
            // Expose the uHover uniform to GLSL
            shader.uniforms.uHover = uHoverUniform;

            // Vertex shader: pass world normal as varying
            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>
varying vec3 vWorldNormal;`
            );
            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>
vWorldNormal = normalize(mat3(modelMatrix) * normal);`
            );

            // Fragment shader: neon color shift on hover
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `#include <common>
uniform float uHover;
varying vec3 vWorldNormal;`
            );
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                `#include <dithering_fragment>

// Fresnel rim effect — stronger on hover
float fresnel = pow(1.0 - abs(dot(vWorldNormal, vec3(0.0, 0.0, 1.0))), 2.5);

// Base color: indigo
vec3 baseColor = vec3(0.388, 0.4, 0.945);
// Hover color: neon cyan
vec3 hoverColor = vec3(0.024, 0.714, 0.831);

// Interpolate color on hover + fresnel glow
vec3 rimColor = mix(baseColor, hoverColor, uHover);
gl_FragColor.rgb += rimColor * fresnel * (0.8 + uHover * 1.2);
`
            );

            // Keep reference to set uniform each frame
            mat.userData.shader = shader;
            mat.userData.uHover = uHoverUniform;
        };

        mat.needsUpdate = true;
        return mat;
    }, [normalMap]);

    // ── Animate uniform + gentle self-rotation each frame ────────────────────
    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // Idle rotation
        meshRef.current.rotation.x += delta * 0.08;
        meshRef.current.rotation.z += delta * 0.05;

        // Smooth hover lerp
        hoverTarget.current = hovered ? 1.0 : 0.0;
        hoverCurrent.current += (hoverTarget.current - hoverCurrent.current) * 0.06;

        if (material.userData.uHover) {
            material.userData.uHover.value = hoverCurrent.current;
        }
    });

    // Forward the ref so GSAP can target this mesh
    React.useImperativeHandle(ref, () => meshRef.current);

    return (
        <mesh
            ref={meshRef}
            material={material}
            onPointerEnter={() => {
                setHovered(true);
                document.body.style.cursor = 'pointer';
            }}
            onPointerLeave={() => {
                setHovered(false);
                document.body.style.cursor = 'default';
            }}
        >
            {/* TorusKnot — visually rich procedural shape, p=3 q=5 */}
            <torusKnotGeometry args={[1.1, 0.38, 200, 24, 3, 5]} />
        </mesh>
    );
});

export default HeroMesh;
