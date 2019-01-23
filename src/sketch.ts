// P5 Sketch
import p5 from "p5";
export default class Sketch {
  private p: p5;
  constructor(instance: p5) {
    this.p = instance;
  }

  public setup(): void{}
  public draw(): void{}
}
