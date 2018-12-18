import p5 from 'p5';
import _ from 'lodash';
import Gh from 'greiner-hormann';
import * as Vor from 'd3-voronoi';
import * as PG from 'd3-polygon';
let p: p5;
export default class Sketch {
  private sites: { x: number, y: number, t: number, n?: {}[] }[];
  private function: Vor.VoronoiLayout<any>;
  private diagram: Vor.VoronoiDiagram<any>;
  constructor (instance: p5) {
    p = instance;
    this.sites = _.range(500).map(i => {
      return {
        x: 250 + (50 * _.random(true)),
        y: 250 + (50 * _.random(true)),
        t: _.random(5),
        n: []
      };

    });
    this.function = Vor.voronoi<any>().size([ 500, 500 ]).x(i => i.x).y(i => i.y);
    this.diagram = this.function(this.sites);
  }

  public setup = () => {
    p.createCanvas(500, 500,'webgl');
    p.colorMode('hsb');
    p.smooth();
  }
  public draw = () => {
    p.translate(-250,-250);
    this.sites[this.sites.length - 1] = {
      x: _.clamp(p.mouseX, 0, 500),
      y: _.clamp(p.mouseY, 0, 500),
      t: 2,
      n: []
    };
    p.background(200);
    p.stroke(0,0,20);
    // p.strokeJoin('round');
    p.strokeWeight(5);
    // Relax and draw;

    this.diagram.polygons().map(polygon => {
      p.fill(polygon.data.t * (360 / 5), 50, 100);
      const d = polygon.data;
      let newSite = PG.polygonCentroid(polygon);
      d.x = newSite[0];
      d.y = newSite[1];
      d.n = [];
      p.beginShape();
      polygon.map(point => p.vertex(point[0], point[1]));
      p.endShape('close');
    });
    this.diagram.links().map(l => {
      l.source.n.push(l.target);
      l.target.n.push(l.source);
    });
    this.diagram = this.function(this.sites);
    document.title = p.frameRate().toPrecision(3);
    let pg = this.diagram.polygons();
    let visited: { x: number, y: number, t: number, n?: {}[] }[] = [];
    let rg: Gh.arrPT[] = [];
  }
}
