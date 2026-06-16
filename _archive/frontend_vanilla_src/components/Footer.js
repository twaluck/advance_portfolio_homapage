export function Footer() {
    const footer = document.createElement('footer');
    footer.style.padding = '2rem';
    footer.style.textAlign = 'center';
    footer.style.color = 'var(--text-secondary)';
    footer.style.borderTop = '1px solid var(--border-color)';
    footer.style.marginTop = '4rem';

    footer.innerHTML = `
    <div class="container">
      <p>&copy; ${new Date().getFullYear()} Jishiteiraku. All rights reserved.</p>
      <div style="margin-top: 1rem; display: flex; justify-content: center; gap: 1.5rem;">
        <a href="#" style="hover:text-primary">Twitter</a>
        <a href="#" style="hover:text-primary">GitHub</a>
        <a href="#" style="hover:text-primary">LinkedIn</a>
      </div>
    </div>
  `;

    return footer;
}
