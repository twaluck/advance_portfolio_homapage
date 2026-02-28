import { ProjectCard } from '../components/ProjectCard.js';

export async function Home() {
    const container = document.createElement('div');
    container.className = 'home-page';

    container.innerHTML = `
    <section class="hero" style="min-height: 80vh; display: flex; align-items: center; justify-content: center; text-align: center; padding: 2rem;">
      <div class="hero-content" style="max-width: 800px;">
        <p class="eyebrow" style="color: var(--accent-cyan); letter-spacing: 2px; text-transform: uppercase; font-size: 0.9rem; margin-bottom: 1rem;">
          AI Student & Developer in Japan
        </p>
        <h1 style="font-size: 4rem; margin-bottom: 1.5rem; line-height: 1.1;">
          Building the <span class="gradient-text">Future</span> of<br>
          Robotics & AI
        </h1>
        <p style="font-size: 1.25rem; color: var(--text-secondary); margin-bottom: 2.5rem; max-width: 600px; margin-left: auto; margin-right: auto;">
          Documenting my journey in robotics research, software engineering, and startup experiments.
          Welcome to my digital garden.
        </p>
        <div class="hero-actions" style="display: flex; gap: 1rem; justify-content: center;">
          <a href="/projects" class="button" data-link>View Projects</a>
          <a href="/logs" class="button ghost" data-link>Read Journal</a>
        </div>
      </div>
    </section>

    <section class="featured class-container container" style="padding-bottom: 4rem;">
       <h2 style="margin-bottom: 2rem; font-size: 2rem; text-align: center;">Featured Work</h2>
       <div id="featured-projects" class="grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
         <div class="glass-card" style="text-align: center;">Loading...</div>
       </div>
    </section>
  `;

    // Fetch featured projects
    try {
        const response = await fetch('http://127.0.0.1:8000/api/projects');
        if (response.ok) {
            const projects = await response.json();
            const grid = container.querySelector('#featured-projects');
            grid.innerHTML = '';

            // Show top 3 projects
            projects.slice(0, 3).forEach(project => {
                grid.appendChild(ProjectCard(project));
            });

            if (projects.length === 0) {
                grid.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No projects to show yet.</p>';
            }
        }
    } catch (e) {
        console.error("Failed to load featured projects", e);
    }

    return container;
}
