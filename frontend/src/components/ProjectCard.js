export function ProjectCard(project) {
    const card = document.createElement('article');
    card.className = 'glass-card project-card';

    const statusColor = project.status === 'ongoing' ? 'var(--accent-cyan)' : 'var(--text-secondary)';

    let imageHTML = '';
    if (project.image_url) {
        imageHTML = `<img src="${project.image_url}" alt="${project.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">`;
    }

    card.innerHTML = `
    ${imageHTML}
    <div class="card-content">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <h3 style="font-size: 1.5rem;">${project.title}</h3>
        <span style="font-size: 0.8rem; padding: 0.25rem 0.5rem; border: 1px solid ${statusColor}; color: ${statusColor}; border-radius: 4px; text-transform: uppercase;">
          ${project.status}
        </span>
      </div>
      <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">${project.summary || 'No summary available.'}</p>
      
      <div class="card-actions" style="display: flex; gap: 1rem;">
        ${project.demo_url ? `<a href="${project.demo_url}" target="_blank" class="button" style="font-size: 0.9rem; padding: 0.5rem 1rem;">Live Demo</a>` : ''}
        ${project.repo_url ? `<a href="${project.repo_url}" target="_blank" class="button ghost" style="font-size: 0.9rem; padding: 0.5rem 1rem;">Source Code</a>` : ''}
      </div>
    </div>
  `;

    return card;
}
