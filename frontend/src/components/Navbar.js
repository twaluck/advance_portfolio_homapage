export function Navbar() {
    const nav = document.createElement('nav');
    nav.className = 'navbar';

    // Styles for Navbar are in style.css or we can inject them here
    // For now, let's assume global styles or utility classes
    nav.style.position = 'fixed';
    nav.style.top = '0';
    nav.style.width = '100%';
    nav.style.padding = '1.5rem 2rem';
    nav.style.display = 'flex';
    nav.style.justifyContent = 'space-between';
    nav.style.alignItems = 'center';
    nav.style.zIndex = '1000';
    nav.style.backdropFilter = 'blur(10px)';
    nav.style.backgroundColor = 'rgba(5, 5, 8, 0.6)';
    nav.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

    nav.innerHTML = `
    <a href="/" class="brand" style="font-weight: 700; font-size: 1.5rem; color: #fff; font-family: var(--font-heading);">
      Portfolio<span style="color: var(--primary-color);">.</span>
    </a>
    <div class="nav-links" style="display: flex; gap: 2rem;">
      <a href="/" data-link>Home</a>
      <a href="/projects" data-link>Projects</a>
      <a href="/logs" data-link>Journal</a>
      <a href="/news" data-link>News</a>
      <a href="/contact" data-link>Contact</a>
    </div>
  `;

    return nav;
}
