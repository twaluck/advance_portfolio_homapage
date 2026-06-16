import React, { useState, useEffect, useCallback } from 'react';

export default function News() {
    const [news, setNews] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNews = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/news');
            if (!res.ok) throw new Error('Failed to fetch news');
            setNews(await res.json());
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchNews(); }, [fetchNews]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetch('/api/news', { method: 'POST' });
            await fetchNews();
        } catch (e) {
            alert('Failed to refresh news');
        } finally {
            setRefreshing(false);
        }
    };

    const handleGenerate = async () => {
        try {
            await fetch('/api/news', { method: 'POST' });
            await fetchNews();
        } catch (e) {
            alert('Failed to generate news');
        }
    };

    return (
        <div className="standard-page">
            <div className="page-hero">
                <div>
                    <h1 className="gradient-text">AI News Digest</h1>
                    <p>Automated daily summaries of the latest in Artificial Intelligence and Robotics.</p>
                </div>
            </div>
            <div className="container" style={{ maxWidth: '860px', paddingBottom: '6rem' }}>
                {loading && (
                    <div className="glass-card" style={{ textAlign: 'center', opacity: 0.5 }}>
                        Loading latest news...
                    </div>
                )}
                {error && (
                    <p style={{ color: 'var(--secondary-color)', textAlign: 'center' }}>
                        Failed to load news. Ensure backend is running.
                    </p>
                )}
                {!loading && !error && news?.summary && (
                    <>
                        <div className="glass-card">
                            <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                            {news.image_url && (
                                <img
                                    src={news.image_url}
                                    alt="News"
                                    style={{ width: '100%', borderRadius: '8px', marginBottom: '1.5rem' }}
                                />
                            )}
                            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.85' }}>
                                {news.summary}
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <button
                                className="button ghost"
                                onClick={handleRefresh}
                                disabled={refreshing}
                            >
                                {refreshing ? 'Refreshing...' : 'Force Refresh'}
                            </button>
                        </div>
                    </>
                )}
                {!loading && !error && !news?.summary && (
                    <div className="glass-card" style={{ textAlign: 'center' }}>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                            No news digest available yet.
                        </p>
                        <button className="button" onClick={handleGenerate}>
                            Generate Digest
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
