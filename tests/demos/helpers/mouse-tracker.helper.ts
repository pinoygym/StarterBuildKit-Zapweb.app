import { Page } from '@playwright/test';

export class MouseTracker {
  async inject(page: Page) {
    // Inject CSS for custom cursor with ring
    await page.addStyleTag({
      content: `
        .demo-cursor {
          position: fixed;
          width: 40px;
          height: 40px;
          border: 3px solid #3b82f6;
          border-radius: 50%;
          pointer-events: none;
          z-index: 10000;
          transition: all 0.1s ease;
        }
        .demo-cursor.click {
          background: rgba(59, 130, 246, 0.3);
          animation: demo-pulse 0.5s ease;
        }
        @keyframes demo-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
      `,
    });

    // Inject JavaScript for cursor tracking
    await page.evaluate(() => {
      const cursor = document.createElement('div');
      cursor.className = 'demo-cursor';
      document.body.appendChild(cursor);

      document.addEventListener('mousemove', (e) => {
        cursor.style.left = `${e.clientX - 20}px`;
        cursor.style.top = `${e.clientY - 20}px`;
      });

      document.addEventListener('click', () => {
        cursor.classList.add('click');
        setTimeout(() => cursor.classList.remove('click'), 500);
      });
    });
  }
}
