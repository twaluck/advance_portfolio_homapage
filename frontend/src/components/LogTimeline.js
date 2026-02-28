export function LogTimeline(logs) {
    const container = document.createElement('div');
    container.className = 'timeline';

    // Basic timeline styles
    const style = document.createElement('style');
    style.textContent = `
    .timeline {
      position: relative;
      padding-left: 2rem;
      border-left: 2px solid var(--border-color);
      margin-left: 1rem;
    }
    .timeline-item {
      position: relative;
      margin-bottom: 3rem;
    }
    .timeline-dot {
      position: absolute;
      left: -2.6rem;
      top: 0.5rem;
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
      background: var(--primary-color);
      box-shadow: 0 0 10px var(--primary-color);
    }
    .timeline-date {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
      display: block;
    }
    .timeline-tags {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .tag {
      font-size: 0.75rem;
      padding: 0.1rem 0.5rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-secondary);
    }
  `;
    container.appendChild(style);

    if (logs.length === 0) {
        container.innerHTML += '<p>No logs found.</p>';
        return container;
    }

    logs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'timeline-item';

        const tagsHTML = log.tags ? log.tags.map(tag => `<span class="tag">#${tag}</span>`).join('') : '';

        item.innerHTML = `
        <div class="timeline-dot"></div>
        <span class="timeline-date">${log.date}</span>
        <div class="glass-card">
          <h3 style="margin-bottom: 0.5rem;">${log.title}</h3>
          <p style="color: var(--text-secondary); margin-bottom: 1rem;">${log.summary}</p>
          <div class="timeline-tags">
            ${tagsHTML}
          </div>
        </div>
      `;
        container.appendChild(item);
    });

    return container;
}
