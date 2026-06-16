import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * useScrollAnim — GSAP ScrollTrigger hook for the 3D hero mesh.
 *
 * Phase 1 (0–40% scroll):  Pull mesh backward on Z, rise on Y.
 * Phase 2 (40–100% scroll): 180° cinematic Y-rotation, drift left on X.
 *
 * @param {React.RefObject} meshRef   - ref to the R3F mesh object
 * @param {React.RefObject} triggerRef - ref to the scroll container DOM element
 */
export default function useScrollAnim(meshRef, triggerRef) {
    useEffect(() => {
        if (!meshRef.current || !triggerRef.current) return;

        const mesh = meshRef.current;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: triggerRef.current,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1.2,           // smooth scrub factor
            },
        });

        // ── Phase 1: Intro Shift (0 → 40%) ───────────────────────────────────
        tl.to(
            mesh.position,
            {
                z: -3.5,
                y: 1.4,
                ease: 'power2.inOut',
                duration: 2,
            },
            0                           // start at 0% of timeline
        );

        tl.to(
            mesh.rotation,
            {
                x: Math.PI * 0.25,
                ease: 'power1.inOut',
                duration: 2,
            },
            0
        );

        // ── Phase 2: Dynamic Rotation (40 → 100%) ────────────────────────────
        tl.to(
            mesh.rotation,
            {
                y: Math.PI,             // 180° cinematic Y-axis rotation
                ease: 'power2.inOut',
                duration: 3,
            },
            2                           // starts after phase 1
        );

        tl.to(
            mesh.position,
            {
                x: -1.8,               // drift left — text breathes right
                z: -4.5,
                y: 0.5,
                ease: 'power2.inOut',
                duration: 3,
            },
            2
        );

        return () => {
            tl.kill();
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, [meshRef, triggerRef]);
}
