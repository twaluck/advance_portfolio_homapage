import React from 'react';

const timelineStyles = `
.timeline {
    position: relative;
    padding-left: 2rem;
    border-left: 2px solid var(--border-color);
    margin-left: 1rem;
}
.timeline-item {
    position: relative;
    margin-bottom: 3rem;
}
.timeline-dot {
    position: absolute;
    left: -2.6rem;
    top: 0.5rem;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: var(--primary-color);
    box-shadow: 0 0 10px var(--primary-color);
}
.timeline-date {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    display: block;
}
.timeline-tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.75rem;
}
.tag {
    font-size: 0.75rem;
    padding: 0.15rem 0.6rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    color: var(--text-secondary);
}
`;

export default function LogTimeline({ logs }) {
    return (
        <>
            <style>{timelineStyles}</style>
            <div className="timeline">
                {logs.length === 0 ? (
                    <p>No logs found.</p>
                ) : (
                    logs.map((log) => (
                        <div key={log.id || log.title} className="timeline-item">
                            <div className="timeline-dot" />
                            <span className="timeline-date">{log.date}</span>
                            <div className="glass-card">
                                <h3 style={{ marginBottom: '0.5rem' }}>{log.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                    {log.summary}
                                </p>
                                {log.tags && (
                                    <div className="timeline-tags">
                                        {log.tags.map((tag) => (
                                            <span key={tag} className="tag">#{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
}
