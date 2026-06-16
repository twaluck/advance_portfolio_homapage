import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ThreeDCanvas from '../components/three/ThreeDCanvas.jsx';
import useScrollAnim from '../components/three/useScrollAnim.js';
import ProjectCard from '../components/ProjectCard.jsx';

export default function Home() {
    const meshRef = useRef(null);
    const containerRef = useRef(null);
    const [featuredProjects, setFeaturedProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(true);

    // GSAP ScrollTrigger — bind mesh to scroll
    useScrollAnim(meshRef, containerRef);

    // Fetch featured projects from backend
    useEffect(() => {
        async function fetchProjects() {
            try {
                const res = await fetch('/api/projects');
                if (res.ok) {
                    const data = await res.json();
                    setFeaturedProjects(data.slice(0, 3));
                }
            } catch (e) {
                console.error('Failed to load featured projects', e);
            } finally {
                setLoadingProjects(false);
            }
        }
        fetchProjects();
    }, []);

    return (
        <main className="home-page" ref={containerRef}>
            {/* ── Fixed 3D Canvas ── */}
            <ThreeDCanvas ref={meshRef} />

            {/* ── Scrolling Content Overlay ── */}
            <div className="scroll-content">

                {/* ── Section 1: Hero ── */}
                <section className="hero-section" style={{ minHeight: '100vh' }}>
                    <div className="hero-text">
                        <p className="eyebrow">AI Student &amp; Developer in Japan</p>
                        <h1 className="hero-h1">
                            Building the{' '}
                            <span className="gradient-text">Future</span>
                            {' '}of<br />
                            Robotics &amp; AI
                        </h1>
                        <p className="hero-sub">
                            Documenting my journey in robotics research, software engineering,
                            and startup experiments. Welcome to my digital garden.
                        </p>
                        <div className="hero-actions">
                            <Link to="/projects" className="button">View Projects</Link>
                            <Link to="/logs" className="button ghost">Read Journal</Link>
                        </div>
                    </div>

                    {/* Scroll Indicator */}
                    <div className="scroll-indicator">
                        <span>Scroll</span>
                        <div className="arrow" />
                    </div>
                </section>

                {/* ── Section 2: About / Mid ── */}
                <section className="about-section">
                    <div className="about-text">
                        <h2>
                            Exploring the edge of{' '}
                            <span className="gradient-text">Human + Machine</span>
                        </h2>
                        <p>
                            I'm a student passionate about building intelligent systems that
                            interact with the physical world — from robotic arms to neural
                            language interfaces.
                        </p>
                        <p>
                            My work sits at the intersection of deep learning, embedded
                            systems, and product design. Every project is a step toward
                            more capable, more human-centric machines.
                        </p>
                        <div style={{ marginTop: '2rem' }}>
                            <Link to="/contact" className="button ghost">Get in touch →</Link>
                        </div>
                    </div>
                    {/* Spacer — 3D model breathes through here */}
                    <div className="about-spacer" />
                </section>

                {/* ── Section 3: Featured Projects ── */}
                <section className="featured-section">
                    <div className="section-header">
                        <h2 className="gradient-text">Featured Work</h2>
                        <p>A selection of recent projects across robotics, AI, and software.</p>
                    </div>

                    {loadingProjects ? (
                        <div className="projects-grid">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="glass-card" style={{ textAlign: 'center', opacity: 0.5 }}>
                                    Loading...
                                </div>
                            ))}
                        </div>
                    ) : featuredProjects.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No projects to show yet.
                        </p>
                    ) : (
                        <div className="projects-grid">
                            {featuredProjects.map(project => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                        <Link to="/projects" className="button ghost">View All Projects →</Link>
                    </div>
                </section>

                {/* Bottom padding so scroll has room */}
                <div style={{ height: '10rem' }} />
            </div>
        </main>
    );
}
