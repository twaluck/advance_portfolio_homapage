import { LogTimeline } from '../components/LogTimeline.js';

export async function Journal() {
    const container = document.createElement('div');
    container.className = 'container journal-page';
    container.style.paddingTop = '4rem';

    container.innerHTML = `
    <header style="text-align: center; margin-bottom: 4rem;">
      <h1 class="gradient-text" style="font-size: 3rem; margin-bottom: 1rem;">Learning Journal</h1>
      <p style="color: var(--text-secondary); max-width: 600px; margin: 0 auto;">
        Documenting my research progress, technical insights, and startup experiments.
      </p>
    </header>
    
    <div id="journal-timeline" style="max-width: 800px; margin: 0 auto;">
      <div class="glass-card" style="text-align: center;">Loading logs...</div>
    </div>
  `;

    // Fetch logs
    try {
        const response = await fetch('http://127.0.0.1:8000/api/logs');
        if (!response.ok) {
            throw new Error('Failed to fetch logs');
        }
        const logs = await response.json();

        const timelineContainer = container.querySelector('#journal-timeline');
        timelineContainer.innerHTML = ''; // Clear loading state

        timelineContainer.appendChild(LogTimeline(logs));

    } catch (error) {
        console.error('Error loading logs:', error);
        const timelineContainer = container.querySelector('#journal-timeline');
        timelineContainer.innerHTML = `<p style="color: var(--secondary-color); text-align: center;">Failed to load logs. Ensure backend is running.</p>`;
    }

    return container;
}
