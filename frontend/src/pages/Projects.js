import { ProjectCard } from '../components/ProjectCard.js';

export async function Projects() {
    const container = document.createElement('div');
    container.className = 'container projects-page';
    container.style.paddingTop = '4rem';

    container.innerHTML = `
    <header style="text-align: center; margin-bottom: 4rem;">
      <h1 class="gradient-text" style="font-size: 3rem; margin-bottom: 1rem;">Projects</h1>
      <p style="color: var(--text-secondary); max-width: 600px; margin: 0 auto;">
        A collection of my work in robotics, AI, and software engineering.
      </p>
    </header>
    
    <div id="projects-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2rem;">
      <div class="glass-card" style="text-align: center;">Loading projects...</div>
    </div>
  `;

    // Fetch projects
    try {
        const response = await fetch('http://127.0.0.1:8000/api/projects');
        if (!response.ok) {
            throw new Error('Failed to fetch projects');
        }
        const projects = await response.json();

        const grid = container.querySelector('#projects-grid');
        grid.innerHTML = ''; // Clear loading state

        if (projects.length === 0) {
            grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No projects found yet.</p>';
        } else {
            projects.forEach(project => {
                grid.appendChild(ProjectCard(project));
            });
        }

    } catch (error) {
        console.error('Error loading projects:', error);
        const grid = container.querySelector('#projects-grid');
        grid.innerHTML = `<p style="color: var(--secondary-color); text-align: center;">Failed to load projects. Ensure backend is running.</p>`;
    }

    return container;
}
