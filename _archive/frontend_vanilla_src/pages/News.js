export async function News() {
    const container = document.createElement('div');
    container.className = 'container news-page';
    container.style.paddingTop = '4rem';

    container.innerHTML = `
    <header style="text-align: center; margin-bottom: 4rem;">
      <h1 class="gradient-text" style="font-size: 3rem; margin-bottom: 1rem;">AI News Digest</h1>
      <p style="color: var(--text-secondary); max-width: 600px; margin: 0 auto;">
        Automated daily summaries of the latest in Artificial Intelligence and Robotics.
      </p>
    </header>
    
    <div id="news-content" style="max-width: 800px; margin: 0 auto;">
      <div class="glass-card" style="text-align: center;">Loading latest news...</div>
    </div>
  `;

    try {
        const response = await fetch('http://127.0.0.1:8000/api/news');
        if (response.ok) {
            const news = await response.json();
            const content = container.querySelector('#news-content');

            if (news.summary) {
                content.innerHTML = `
                <div class="glass-card">
                    <div style="margin-bottom: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
                        ${new Date().toLocaleDateString()}
                    </div>
                    ${news.image_url ? `<img src="${news.image_url}" alt="News Image" style="width: 100%; border-radius: 8px; margin-bottom: 1.5rem;">` : ''}
                    <div style="white-space: pre-wrap; line-height: 1.8;">${news.summary}</div>
                </div>
                <div style="text-align: center; margin-top: 2rem;">
                    <button id="refresh-news" class="button ghost">Force Refresh</button>
                </div>
            `;

                // Add refresh handler
                content.querySelector('#refresh-news').addEventListener('click', async () => {
                    const btn = content.querySelector('#refresh-news');
                    btn.textContent = 'Refreshing...';
                    btn.disabled = true;
                    try {
                        await fetch('http://127.0.0.1:8000/api/news', { method: 'POST' });
                        window.location.reload();
                    } catch (e) {
                        alert('Failed to refresh news');
                        btn.textContent = 'Force Refresh';
                        btn.disabled = false;
                    }
                });

            } else {
                content.innerHTML = `
                <div class="glass-card" style="text-align: center;">
                    <p>No news digest available yet.</p>
                    <button id="init-news" class="button" style="margin-top: 1rem;">Generate Digest</button>
                </div>
            `;
                content.querySelector('#init-news').addEventListener('click', async () => {
                    try {
                        await fetch('http://127.0.0.1:8000/api/news', { method: 'POST' });
                        window.location.reload();
                    } catch (e) {
                        alert('Failed to generate news');
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error loading news:', error);
        const content = container.querySelector('#news-content');
        content.innerHTML = `<p style="color: var(--secondary-color); text-align: center;">Failed to load news. Ensure backend is running.</p>`;
    }

    return container;
}
