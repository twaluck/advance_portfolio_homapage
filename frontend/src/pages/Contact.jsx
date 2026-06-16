import React, { useState } from 'react';

const inputStyle = {
    width: '100%',
    padding: '0.8rem 1rem',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid var(--border-color)',
    color: 'white',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'border-color 0.2s ease',
    outline: 'none',
};

export default function Contact() {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [sent, setSent] = useState(false);

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        // Future: POST to backend /api/contact
        console.log('Contact form submitted:', form);
        setSent(true);
    };

    return (
        <div className="standard-page">
            <div className="page-hero">
                <div>
                    <h1 className="gradient-text">Get in Touch</h1>
                    <p>Interested in collaborating or have a question about my research?</p>
                </div>
            </div>
            <div className="container" style={{ maxWidth: '640px', paddingBottom: '6rem' }}>
                <div className="glass-card">
                    {sent ? (
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>✓</p>
                            <h3 style={{ marginBottom: '0.5rem' }}>Message Sent!</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Thanks for reaching out. I'll get back to you soon.
                            </p>
                            <button className="button ghost" style={{ marginTop: '1.5rem' }}
                                onClick={() => setSent(false)}>
                                Send Another
                            </button>
                        </div>
                    ) : (
                        <>
                            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                Feel free to reach out about research, projects, or opportunities.
                            </p>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        style={inputStyle}
                                        required
                                        placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        style={inputStyle}
                                        required
                                        placeholder="your@email.com"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        Message
                                    </label>
                                    <textarea
                                        name="message"
                                        rows="6"
                                        value={form.message}
                                        onChange={handleChange}
                                        style={{ ...inputStyle, resize: 'vertical' }}
                                        required
                                        placeholder="Tell me what's on your mind..."
                                    />
                                </div>
                                <button type="submit" className="button" style={{ marginTop: '0.5rem' }}>
                                    Send Message
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
