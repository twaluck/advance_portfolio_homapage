
import './style.css';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { Home } from './pages/Home.js';
import { Projects } from './pages/Projects.js';
import { Journal } from './pages/Journal.js';
import { News } from './pages/News.js';
import { Contact } from './pages/Contact.js';

const app = document.querySelector('#app');

// Simple Router
const routes = {
    '/': Home,
    '/projects': Projects,
    '/logs': Journal,
    '/news': News,
    '/contact': Contact,
};

function navigateTo(url) {
    history.pushState(null, null, url);
    router();
}

let currentRenderId = 0;

async function router() {
    const renderId = ++currentRenderId;
    const path = window.location.pathname;
    // Basic route matching
    const component = routes[path] || routes['/'];

    // We can't clear app immediately if we want to avoid flashes, 
    // but for simplicity and to ensure cleanliness:
    app.innerHTML = '';

    // Add Navbar
    app.appendChild(Navbar());

    // Add Page Content
    const main = document.createElement('main');
    // Show a loading state if needed, or just wait

    // Handle async components
    try {
        const pageContent = await component();
        // If another navigation happened while we were awaiting, abort this render
        if (renderId !== currentRenderId) return;
        main.appendChild(pageContent);
    } catch (error) {
        if (renderId !== currentRenderId) return;
        console.error('Route error:', error);
        main.innerHTML = '<h1>Error loading page</h1>';
    }

    if (renderId !== currentRenderId) return;
    app.appendChild(main);
    app.appendChild(Footer());
}

window.addEventListener('popstate', router);

document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', e => {
        const link = e.target.closest('[data-link]');
        if (link) {
            e.preventDefault();
            navigateTo(link.href);
        }
    });
    router();
});
