import React from 'react';

export default function ProjectCard({ project }) {
    const statusColor =
        project.status === 'ongoing' ? 'var(--accent-cyan)' : 'var(--text-secondary)';

    return (
        <article className="glass-card project-card">
            {project.image_url && (
                <img
                    src={project.image_url}
                    alt={project.title}
                    style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                    }}
                />
            )}
            <div className="card-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.4rem' }}>{project.title}</h3>
                    <span style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.6rem',
                        border: `1px solid ${statusColor}`,
                        color: statusColor,
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}>
                        {project.status}
                    </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    {project.summary || 'No summary available.'}
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {project.demo_url && (
                        <a href={project.demo_url} target="_blank" rel="noreferrer"
                           className="button" style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}>
                            Live Demo
                        </a>
                    )}
                    {project.repo_url && (
                        <a href={project.repo_url} target="_blank" rel="noreferrer"
                           className="button ghost" style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}>
                            Source Code
                        </a>
                    )}
                </div>
            </div>
        </article>
    );
}
