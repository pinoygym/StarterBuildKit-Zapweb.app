import { Page } from '@playwright/test';

export class KeyboardDisplay {
  async inject(page: Page) {
    // Inject keyboard display overlay
    await page.addStyleTag({
      content: `
        .keyboard-display {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-size: 18px;
          z-index: 10001;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .keyboard-display.show {
          opacity: 1;
        }
      `,
    });

    await page.evaluate(() => {
      const display = document.createElement('div');
      display.className = 'keyboard-display';
      document.body.appendChild(display);

      let timeout: ReturnType<typeof setTimeout>;

      document.addEventListener('keydown', (e) => {
        const key = e.key === ' ' ? 'Space' : e.key;
        const modifiers = [];
        if (e.ctrlKey) modifiers.push('Ctrl');
        if (e.altKey) modifiers.push('Alt');
        if (e.shiftKey) modifiers.push('Shift');

        const keyCombo = [...modifiers, key].join(' + ');
        display.textContent = keyCombo;
        display.classList.add('show');

        clearTimeout(timeout);
        timeout = setTimeout(() => {
          display.classList.remove('show');
        }, 2000);
      });
    });
  }
}
