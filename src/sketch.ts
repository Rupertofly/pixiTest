import * as d3 from 'd3';
import * as PG from "d3-polygon";
import * as Vor from "d3-voronoi";
import Gh from "greiner-hormann";
import _ from "lodash";
import p5, { Color } from "p5";
import Offset from "polygon-offset";
let p: p5;

export default class Sketch {
  private sites: Array<{ x: number; y: number; t: number; n?: Array<{}> }>;
  private function: Vor.VoronoiLayout<any>;
  private diagram: Vor.VoronoiDiagram<any>;

  constructor(instance: p5) {
    p = instance;
    this.sites = _.range(200).map(i => {
      return {
        x: 250 + 50 * _.random(true),
        y: 250 + 50 * _.random(true),
        t: _.random(9),
        n: []
      };
    });
    this.function = Vor.voronoi<any>()
      .size([500, 500])
      .x(i => i.x)
      .y(i => i.y);
    this.diagram = this.function(this.sites);
  }

  public setup = () => {
    p.createCanvas(1000, 1000);
  }
  public draw = () => {
    p.loadPixels();
    const s = 1 / 10;
    const ts = 1 / 60;
    const t = p.frameCount / 50;
    _.range( p.pixels.length ).forEach( i => {
      const [x, y] = [i % p.width, _.floor( i / p.width )];
      const v = p.noise( x * s, y * s, t );
      const n = p.noise( (300+x )* s/2, y * s, t );
      const m = p.noise( (600+x) * s/2, y * s, t );
      const c = p.color( d3.cubehelix( (v * 720)%360, 2*n, 0.7+0.2*m ).hex() );
      p.set( x, y, c );
    } );
    p.updatePixels();
}
}
