import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Navbar() {
    return (
        <nav className="navbar">
            <NavLink to="/" className="navbar-brand">
                Portfolio<span>.</span>
            </NavLink>
            <ul className="nav-links">
                <li><NavLink to="/" end>Home</NavLink></li>
                <li><NavLink to="/projects">Projects</NavLink></li>
                <li><NavLink to="/logs">Journal</NavLink></li>
                <li><NavLink to="/news">News</NavLink></li>
                <li><NavLink to="/contact">Contact</NavLink></li>
            </ul>
        </nav>
    );
}
