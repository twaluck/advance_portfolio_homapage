export function Contact() {
    const container = document.createElement('div');
    container.className = 'container contact-page';
    container.style.paddingTop = '4rem';
    container.style.maxWidth = '600px';

    container.innerHTML = `
    <h1 class="gradient-text" style="font-size: 3rem; margin-bottom: 2rem; text-align: center;">Get in Touch</h1>
    <div class="glass-card">
      <p style="margin-bottom: 2rem; color: var(--text-secondary); text-align: center;">
        Interested in collaborating or have a question about my research?
        Feel free to reach out.
      </p>
      <form style="display: flex; flex-direction: column; gap: 1rem;">
        <div>
          <label style="display: block; margin-bottom: 0.5rem;">Name</label>
          <input type="text" style="width: 100%; padding: 0.75rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: white; border-radius: 8px;">
        </div>
        <div>
          <label style="display: block; margin-bottom: 0.5rem;">Email</label>
          <input type="email" style="width: 100%; padding: 0.75rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: white; border-radius: 8px;">
        </div>
        <div>
          <label style="display: block; margin-bottom: 0.5rem;">Message</label>
          <textarea rows="5" style="width: 100%; padding: 0.75rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: white; border-radius: 8px;"></textarea>
        </div>
        <button type="submit" class="button" style="margin-top: 1rem;">Send Message</button>
      </form>
    </div>
  `;

    return container;
}
