import React, { useState, useEffect } from 'react';
import ProjectCard from '../components/ProjectCard.jsx';

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchProjects() {
            try {
                const res = await fetch('/api/projects');
                if (!res.ok) throw new Error('Failed to fetch projects');
                setProjects(await res.json());
            } catch (e) {
                console.error(e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        fetchProjects();
    }, []);

    return (
        <div className="standard-page">
            <div className="page-hero">
                <div>
                    <h1 className="gradient-text">Projects</h1>
                    <p>A collection of my work in robotics, AI, and software engineering.</p>
                </div>
            </div>
            <div className="container" style={{ paddingBottom: '6rem' }}>
                {loading && (
                    <div className="projects-grid">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="glass-card" style={{ textAlign: 'center', opacity: 0.5 }}>
                                Loading...
                            </div>
                        ))}
                    </div>
                )}
                {error && (
                    <p style={{ color: 'var(--secondary-color)', textAlign: 'center' }}>
                        Failed to load projects. Ensure backend is running.
                    </p>
                )}
                {!loading && !error && projects.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No projects found yet.
                    </p>
                )}
                {!loading && !error && projects.length > 0 && (
                    <div className="projects-grid">
                        {projects.map(project => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
