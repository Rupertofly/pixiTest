import Pol from 'd3-polygon';
import Vor from "d3-voronoi";
import p5 from 'p5';

type myPG = Vor.VoronoiPolygon<VorCell>;

export class VorDiagram {
  public layoutFunction: Vor.VoronoiLayout<{ x: number; y: number }>;
  public count: number;
  public cells: VorCell[] = [];
  constructor(width: number, height: number, count?: number, random?: boolean) {
    this.layoutFunction = Vor.voronoi<{ x: number; y: number }>()
      .size([width, height])
      .x((a: any) => a.x)
      .y((a: any) => a.y);
    this.count = count || Math.floor( ( width * height ) / 30 ** 2 );

  }
}
export class VorCell {
  public position: p5.Vector;
  public polygon: myPG | null;
  public centroid: pt | null;

  constructor( x: number, y: number ) {
    this.position = new p5.Vector().set( x, y );
    this.polygon = null;
    this.centroid = null;
  }
  public set( posArr: pt ): this;
  public set( x: number, y: number ): this;
  public set( x: number|pt, y?: number ) {
    if ( arguments.length > 1 ) {
      this.position.set( x as number, y );
      return this;
    }
    this.position.set( arguments[0][0], arguments[0][1] );
    return this;
  }
  get x() {
    return this.position.x;
  }
  get y() {
    return this.position.y;
  }
  public calculateCentroid() {
    if (!this.polygon) throw new Error('No Polygon Available');
    this.centroid = Pol.polygonCentroid(this.polygon as myPG);
  }


}
