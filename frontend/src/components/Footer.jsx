import React from 'react';

export default function Footer() {
    return (
        <footer>
            <div className="container">
                <p>&copy; {new Date().getFullYear()} Jishiteiraku. All rights reserved.</p>
                <ul className="footer-links">
                    <li><a href="#" target="_blank" rel="noreferrer">Twitter</a></li>
                    <li><a href="#" target="_blank" rel="noreferrer">GitHub</a></li>
                    <li><a href="#" target="_blank" rel="noreferrer">LinkedIn</a></li>
                </ul>
            </div>
        </footer>
    );
}
