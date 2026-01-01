import { Page } from '@playwright/test';

export class AnnotationHelper {
  async addCallout(
    page: Page,
    selector: string,
    text: string,
    position: 'top' | 'right' | 'bottom' | 'left' = 'right',
    duration: number = 3000
  ) {
    await page.evaluate(
      ({ selector, text, position, duration }) => {
        const target = document.querySelector(selector);
        if (!target) return;

        const rect = target.getBoundingClientRect();
        const callout = document.createElement('div');
        callout.className = 'demo-callout';
        callout.innerHTML = `
          <div class="callout-text">${text}</div>
        `;

        // Position callout
        const positions = {
          top: { left: rect.left + rect.width / 2, top: rect.top - 60 },
          right: { left: rect.right + 20, top: rect.top + rect.height / 2 },
          bottom: { left: rect.left + rect.width / 2, top: rect.bottom + 20 },
          left: { left: rect.left - 220, top: rect.top + rect.height / 2 },
        };

        Object.assign(callout.style, {
          position: 'fixed',
          left: `${positions[position].left}px`,
          top: `${positions[position].top}px`,
          background: '#3b82f6',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '14px',
          zIndex: '10002',
          opacity: '0',
          transition: 'opacity 0.3s ease',
        });

        document.body.appendChild(callout);

        // Fade in
        setTimeout(() => {
          callout.style.opacity = '1';
        }, 10);

        // Auto-remove after duration
        setTimeout(() => {
          callout.style.opacity = '0';
          setTimeout(() => callout.remove(), 300);
        }, duration);
      },
      { selector, text, position, duration }
    );

    await page.waitForTimeout(duration + 500);
  }

  async highlightSection(
    page: Page,
    selector: string,
    label: string,
    duration: number = 3000
  ) {
    await page.evaluate(
      ({ selector, label, duration }) => {
        const target = document.querySelector(selector);
        if (!target) return;

        const overlay = document.createElement('div');
        overlay.className = 'demo-highlight-overlay';
        overlay.innerHTML = `<div class="highlight-label" style="position: absolute; top: -30px; left: 0; background: #f59e0b; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${label}</div>`;

        const rect = target.getBoundingClientRect();
        Object.assign(overlay.style, {
          position: 'fixed',
          left: `${rect.left - 10}px`,
          top: `${rect.top - 10}px`,
          width: `${rect.width + 20}px`,
          height: `${rect.height + 20}px`,
          border: '3px solid #f59e0b',
          borderRadius: '8px',
          zIndex: '10003',
          opacity: '0',
          transition: 'opacity 0.3s ease',
        });

        document.body.appendChild(overlay);

        // Fade in
        setTimeout(() => {
          overlay.style.opacity = '1';
        }, 10);

        // Auto-remove after duration
        setTimeout(() => {
          overlay.style.opacity = '0';
          setTimeout(() => overlay.remove(), 300);
        }, duration);
      },
      { selector, label, duration }
    );

    await page.waitForTimeout(duration + 500);
  }
}
