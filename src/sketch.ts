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
    p.createCanvas(500, 500);
    p.colorMode("rgb");
    p.smooth();
  }
  public draw = () => {
    // p.translate(-250, -250);
    this.sites[this.sites.length - 1] = {
      x: _.clamp(p.mouseX, 0, 500),
      y: _.clamp(p.mouseY, 0, 500),
      t: 2,
      n: []
    };
    p.background(255);
    p.stroke(0, 0, 20);
    // p.strokeJoin('round');
    p.strokeWeight( 6 );
    p.strokeJoin( p.MITER );
    // Relax and draw;

    this.diagram.polygons().map(polygon => {
      p.fill( d3.cubehelix( polygon.data.t * ( 360 / 8 ), 1.6, 0.8 ).rgb().hex() );
      p.stroke(d3.cubehelix( polygon.data.t * ( 360 / 8 ), 1.0, 0.9 ).rgb().hex() );
      const d = polygon.data;
      const newSite = PG.polygonCentroid(polygon);
      d.x = newSite[0];
      d.y = newSite[1];
      d.n = [];
      let npoly;
      if (p.frameCount > 300){
      npoly = new Offset().data( [
        ...polygon,polygon[0]
      ]).padding(6)[0];
    } else  npoly = polygon;
      p.beginShape();
      npoly.map(point => p.vertex(point[0], point[1]));
      p.endShape();
    });
    this.diagram.links().map(l => {
      l.source.n.push(l.target);
      l.target.n.push(l.source);
    });
    this.diagram = this.function(this.sites);
    document.title = p.frameRate().toPrecision(3);
    const pg = this.diagram.polygons();
    const visited: Array<{
      x: number;
      y: number;
      t: number;
      n?: Array<{}>;
    }> = [];
    const rg: Gh.arrPT[] = [];
  }
}
