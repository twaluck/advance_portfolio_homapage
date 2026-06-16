import React, { useState, useEffect } from 'react';
import LogTimeline from '../components/LogTimeline.jsx';

export default function Journal() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchLogs() {
            try {
                const res = await fetch('/api/logs');
                if (!res.ok) throw new Error('Failed to fetch logs');
                setLogs(await res.json());
            } catch (e) {
                console.error(e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        fetchLogs();
    }, []);

    return (
        <div className="standard-page">
            <div className="page-hero">
                <div>
                    <h1 className="gradient-text">Learning Journal</h1>
                    <p>Documenting my research progress, technical insights, and startup experiments.</p>
                </div>
            </div>
            <div className="container" style={{ maxWidth: '860px', paddingBottom: '6rem' }}>
                {loading && (
                    <div className="glass-card" style={{ textAlign: 'center', opacity: 0.5 }}>
                        Loading logs...
                    </div>
                )}
                {error && (
                    <p style={{ color: 'var(--secondary-color)', textAlign: 'center' }}>
                        Failed to load logs. Ensure backend is running.
                    </p>
                )}
                {!loading && !error && (
                    <LogTimeline logs={logs} />
                )}
            </div>
        </div>
    );
}
