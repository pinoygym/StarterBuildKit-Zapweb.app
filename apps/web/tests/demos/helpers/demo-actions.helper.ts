import { Page, Locator } from '@playwright/test';

export class DemoActions {
  private defaultDelay = 1500; // 1.5 seconds between actions

  constructor(private page: Page) {}

  /**
   * Click with visual feedback and delay
   */
  async click(locator: Locator, options?: { delay?: number; highlight?: boolean }) {
    const delay = options?.delay ?? this.defaultDelay;
    const highlight = options?.highlight ?? true;

    if (highlight) {
      await this.highlightElement(locator);
    }

    await locator.click();
    await this.wait(delay);
  }

  /**
   * Fill input with typing effect
   */
  async fill(locator: Locator, text: string, options?: { delay?: number; typingSpeed?: number }) {
    const delay = options?.delay ?? this.defaultDelay;
    const typingSpeed = options?.typingSpeed ?? 100; // ms per character

    await this.highlightElement(locator);

    // Type character by character
    await locator.fill(''); // Clear first
    for (const char of text) {
      await locator.pressSequentially(char, { delay: typingSpeed });
    }

    await this.wait(delay);
  }

  /**
   * Select from dropdown
   */
  async selectOption(locator: Locator, value: string, options?: { delay?: number }) {
    const delay = options?.delay ?? this.defaultDelay;

    await this.highlightElement(locator);
    await locator.selectOption(value);
    await this.wait(delay);
  }

  /**
   * Hover to show tooltip or highlight
   */
  async hover(locator: Locator, options?: { delay?: number }) {
    const delay = options?.delay ?? this.defaultDelay;

    await locator.hover();
    await this.wait(delay);
  }

  /**
   * Navigate with pause
   */
  async goto(url: string, options?: { delay?: number }) {
    const delay = options?.delay ?? 2000;

    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    await this.wait(delay);
  }

  /**
   * Scroll element into view with smooth animation
   */
  async scrollIntoView(locator: Locator, options?: { delay?: number }) {
    const delay = options?.delay ?? 1000;

    await locator.scrollIntoViewIfNeeded();
    await this.wait(delay);
  }

  /**
   * Highlight element with border and glow
   */
  private async highlightElement(locator: Locator) {
    try {
      await locator.evaluate((el: HTMLElement) => {
        el.style.outline = '3px solid #3b82f6';
        el.style.outlineOffset = '2px';
        el.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.6)';

        setTimeout(() => {
          el.style.outline = '';
          el.style.outlineOffset = '';
          el.style.boxShadow = '';
        }, 2000);
      });

      await this.wait(500); // Brief pause after highlight
    } catch (error) {
      // Element might not be ready, skip highlighting
      console.warn('Could not highlight element');
    }
  }

  /**
   * Wait utility
   */
  async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Take a screenshot with labeled caption
   */
  async screenshot(name: string, caption?: string) {
    const screenshotDir = 'demo-recordings/screenshots';
    await this.page.screenshot({
      path: `${screenshotDir}/${name}.png`,
      fullPage: false,
    });

    if (caption) {
      console.log(`📸 Screenshot: ${name} - ${caption}`);
    }
  }
}
