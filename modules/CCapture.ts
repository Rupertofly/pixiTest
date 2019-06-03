interface CapOpts extends ICCaptureOptions {
  len: number;
  target: HTMLCanvasElement | HTMLElement;
}

export default class Capturer extends CCapture {
  len: number;
  isFinite: boolean;
  isStarted = false;
  target: HTMLElement;
  complete = false;
  frameNum = 0;

  constructor(opts: CapOpts) {
    super(opts);
    if (!CCapture) throw new Error('No CCapture detected');

    this.len = opts.len;
    this.isFinite = opts.len > 0;
    this.target = <HTMLElement>opts.target;
  }
  saveFrame() {
    if (this.complete) return;
    if (!this.isStarted) {
      this.start();
      this.isStarted = true;
    }
    this.capture(this.target);
    if (this.isFinite && this.frameNum === this.len) {
      this.stopCapture();
      return;
    }
    this.frameNum++;
    return;
  }

  saveFinalFrame() {
    if (this.complete) return;
    this.saveFrame();
    this.stopCapture();
  }

  stopCapture() {
    if (this.complete) return;
  }
}
