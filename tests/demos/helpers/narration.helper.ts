export interface NarrationCue {
  timestamp: number;
  text: string;
  duration: number;
  action?: string;
}

export class NarrationHelper {
  private cues: NarrationCue[] = [];
  private startTime: number = 0;

  constructor(private videoTitle: string) {}

  /**
   * Record a narration cue with timestamp
   */
  async narrate(text: string, duration: number = 3000, action?: string) {
    if (this.startTime === 0) {
      this.startTime = Date.now();
    }

    const timestamp = Date.now() - this.startTime;
    const cue: NarrationCue = {
      timestamp,
      text,
      duration,
      action,
    };

    this.cues.push(cue);

    // Console output for real-time monitoring
    const timeStr = this.formatTimestamp(timestamp);
    console.log(`[${timeStr}] 🎙️  ${text}`);
    if (action) {
      console.log(`       Action: ${action}`);
    }

    // Wait for narration duration
    await this.wait(duration);
  }

  /**
   * Export narration script to JSON
   */
  exportScript(): string {
    return JSON.stringify(
      {
        videoTitle: this.videoTitle,
        totalDuration: Date.now() - this.startTime,
        cues: this.cues,
      },
      null,
      2
    );
  }

  /**
   * Export SRT subtitle format
   */
  exportSRT(): string {
    let srt = '';
    this.cues.forEach((cue, index) => {
      const startTime = this.formatSRTTimestamp(cue.timestamp);
      const endTime = this.formatSRTTimestamp(cue.timestamp + cue.duration);

      srt += `${index + 1}\n`;
      srt += `${startTime} --> ${endTime}\n`;
      srt += `${cue.text}\n\n`;
    });
    return srt;
  }

  /**
   * Wait utility
   */
  private async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Format timestamp as MM:SS
   */
  private formatTimestamp(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  /**
   * Format timestamp for SRT (HH:MM:SS,mmm)
   */
  private formatSRTTimestamp(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = ms % 1000;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
  }
}
