import * as d3 from 'd3';
import * as cl from 'js-clipper';
import _ from 'lodash';
import p5 from 'p5';
import bSpline from './bSpline';
type point = [number, number];
type lp = point[];
export namespace polygonNamespace {
  function sqr(x: number) {
    return x * x;
  }
  function dist2(v: point, w: point) {
    return sqr(v[0] - w[0]) + sqr(v[1] - w[1]);
  }
  function distToSegmentSquared(p: point, v: point, w: point) {
    const l2 = dist2(v, w);
    if (l2 === 0) return dist2(p, v);
    let t =
      ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
    t = Math.max(0, Math.min(1, t));
    return dist2(p, [v[0] + t * (w[0] - v[0]), v[1] + t * (w[1] - v[1])]);
  }
  /**
   * Returns Distance betweeen a point and a line
   *
   * @param {[Number,Number]} origin Point
   * @param {[Number,Number]} first line vertice
   * @param {[Number,Number]} second line vertice
   * @returns {Number} Distance
   */
  export function distToSegment(p: point, v: point, w: point) {
    return Math.sqrt(distToSegmentSquared(p, v, w));
  }
  /**
   * Returns the minimum distance between the centroid of a polygon and an edge
   *
   * @param {[Number, Number][]} poly polygon
   *
   */
  export function getMinDist(poly: point[]) {
    const c = d3.polygonCentroid(poly);
    const r = _.range(poly.length).map(i => {
      const thisP = poly[i];
      const nextP = poly[(i + 1) % poly.length];
      return distToSegment(c, thisP, nextP);
    });
    return Math.min(...r);
  }

  export function smoothBSpline(
    polygon: loop,
    order: number,
    resolution: number
  ) {
    let output: lp = [];
    let polygonAdjusted = [
      ...polygon,
      ...polygon.slice(0, Math.min(order, polygon.length - 1))
    ];
    for (let t = 0; t < 1; t += 1 / resolution) {
      output.push(
        bSpline(t, Math.min(order, polygon.length - 1), polygonAdjusted)
      );
    }
    return output;
  }
  export function smoothPolygon<T extends loop | MyPolygon>(
    polygon: T,
    order: number,
    resolution: number
  ) {
    if (_.isArray((polygon as lp)[0])) {
      return smoothBSpline(polygon as lp, order, resolution) as T;
    } else if ((polygon as MyPolygon).isComplex) {
      let outPoly = new MyPolygon();
      outPoly.polygon = smoothBSpline(
        (polygon as MyPolygon).polygon,
        order,
        resolution
      );
      outPoly.contours = (polygon as MyPolygon).contours.map(ctr => {
        return smoothBSpline(ctr, order, resolution);
      });
      return outPoly as T;
    } else {
      throw new Error('wat');
    }
  }
}
export namespace JSClipperHelper {
  export function cleanPolygon(polygon: lp, ammount: number) {
    let adjPoly = toClipperFormat(polygon);
    return fromClipperFormat(cl.JS.Clean(adjPoly, ammount * 10000));
  }
  export function joinPolygons<T extends Array<lp | MyPolygon>>(polygons: T) {
    let procPoly: cl.paths = [];
    let isLoop = true;
    if ((polygons as MyPolygon[])[0].offset) {
      isLoop = false;
      (polygons as MyPolygon[]).forEach(pg => {
        procPoly.push(...pg.toJSPaths());
      });
    } else {
      // Prepare Polygons for Joining
      procPoly.push(
        ...(polygons as lp[]).map(poly => {
          return toClipperFormat(poly);
        })
      );
    }
    // Create new Clipper
    const clipper = new cl.Clipper();
    let solution = new cl.PolyTree();
    clipper.AddPaths(procPoly, cl.PolyType.ptSubject, true);
    clipper.Execute(
      cl.ClipType.ctUnion,
      solution,
      cl.PolyFillType.pftEvenOdd,
      cl.PolyFillType.pftEvenOdd
    );
    let result = cl.JS.PolyTreeToExPolygons(solution);
    if (!result[0]) return new MyPolygon(fromClipperFormat(procPoly[0]));
    else if (result.length < 2) return new MyPolygon(result[0]);
    else {
      return result
        .map(pl => new MyPolygon(pl))
        .sort(
          (a, b) => d3.polygonArea(a.polygon) - d3.polygonArea(b.polygon)
        )[0];
    }
  }
  export function offsetPolygon(
    poly: lp,
    ammount: number,
    jType?: cl.JoinType
  ): lp {
    let adjustedPoly = toClipperFormat(poly);
    let amt = 1000 * ammount;
    const offset = new cl.ClipperOffset();
    let result: cl.IntPoint[][] = [];
    offset.AddPath(
      adjustedPoly,
      jType || cl.JoinType.jtMiter,
      cl.EndType.etClosedPolygon
    );
    let success = offset.Execute(result, amt);
    if (!result[0]) return fromClipperFormat(adjustedPoly);
    else if (result.length < 2) return fromClipperFormat(result[0]);
    else {
      return result
        .map(pl => fromClipperFormat(pl))
        .sort((a, b) => d3.polygonArea(a) - d3.polygonArea(b))[0];
    }
  }
  export function fromClipperFormat(polygon: cl.IntPoint[]): lp {
    return polygon.map(pt => {
      return [pt.X / 10000, pt.Y / 10000] as point;
    });
  }

  export function toClipperFormat(polygon: lp) {
    let thePoly = polygon.map(pt => {
      return {
        X: Math.floor(pt[0] * 10000),
        Y: Math.floor(pt[1] * 10000)
      };
    });
    return thePoly;
  }
}
type vecFunc = (x: number, y: number) => void;
export class MyPolygon {
  public polygon: Array<[number, number]> = [];
  public contours: Array<Array<[number, number]>> = [];

  constructor(polygon?: loop | cl.ExPolygon | cl.PolyTree, contour?: loop[]) {
    if (!polygon) return this;
    if (polygon instanceof cl.ExPolygon) {
      this.polygon =
        JSClipperHelper.fromClipperFormat(
          (polygon as cl.ExPolygon).outer || []
        ) || [];
      polygon = polygon as cl.ExPolygon;
      if (polygon.holes !== null && polygon.holes.length > 0) {
        polygon.holes.forEach(hole => {
          this.contours.push(JSClipperHelper.fromClipperFormat(hole));
        });
      }
    } else if (polygon instanceof cl.PolyTree) {
      let ex = cl.JS.PolyTreeToExPolygons(polygon)[0];
      this.polygon = JSClipperHelper.fromClipperFormat(
        ex.outer as cl.IntPoint[]
      );
      if (ex.holes !== null && ex.holes.length > 0) {
        ex.holes.forEach(hole => {
          this.contours.push(JSClipperHelper.fromClipperFormat(hole));
        });
      }
    } else if (_.isArray(polygon)) {
      this.polygon = polygon;
    } else {
      throw new Error('Wrong Type');
    }
  }
  public isComplex() {
    return this.contours.length > 0;
  }
  public smooth(order: number, resolution: number) {
    let wk = polygonNamespace.smoothPolygon(this, order, resolution);
    this.polygon = wk.polygon;
    this.contours = wk.contours;
    return this;
  }
  public offset(ammount: number, jointype?: cl.JoinType) {
    if (!this.isComplex()) {
      this.polygon = JSClipperHelper.offsetPolygon(
        this.polygon,
        ammount,
        jointype
      );
      return this;
    } else {
      let working: cl.ExPolygon = { outer: null, holes: null };
      working.outer = JSClipperHelper.toClipperFormat(this.polygon);
      working.holes = this.contours.map(ctr =>
        JSClipperHelper.toClipperFormat(ctr)
      );
      let amt = 1000 * ammount;
      const offset = new cl.ClipperOffset();
      let result = new cl.PolyTree();
      offset.AddPaths(
        cl.JS.ExPolygonsToPaths([working]),
        jointype || cl.JoinType.jtMiter,
        cl.EndType.etClosedPolygon
      );
      let success = offset.Execute(result, amt);
      let resEx = cl.JS.PolyTreeToExPolygons(result);
      if (!resEx[0]) {
        return this;
      } else {
        let wkEx = this.FromJSExPoly(resEx[0]);
        this.polygon = wkEx.polygon;
        this.contours = wkEx.contours;
        return this;
      }
    }

    return this;
  }
  public draw(pI: p5): this;
  public draw(oFunc: vecFunc, cFunc?: vecFunc): this;
  public draw(arg1: p5 | vecFunc, arg2?: vecFunc) {
    if (typeof arg1 === 'object') {
      this._drawP5(arg1);
    } else {
      if (arg1) {
        this._drawF(arg1, arg2 as vecFunc);
      } else this._drawF(arg1 as vecFunc);
    }
    return this;
  }
  public toJSPaths() {
    let out: cl.paths = [];
    out.push(JSClipperHelper.toClipperFormat(this.polygon));
    out.push(...this.contours.map(ctr => JSClipperHelper.toClipperFormat(ctr)));
    return out;
  }
  public FromJSExPoly(ExPoly: cl.ExPolygon) {
    let output: { polygon: lp; contours: lp[] } = { polygon: [], contours: [] };
    output.polygon = JSClipperHelper.fromClipperFormat(
      ExPoly.outer as cl.IntPoint[]
    );
    output.contours = (ExPoly.holes || []).map(hl => {
      return JSClipperHelper.fromClipperFormat(hl);
    });
    return output;
  }
  private _drawP5(pI: p5) {
    pI.beginShape();
    this.polygon.forEach(pt => pI.vertex(pt[0], pt[1]));
    if (this.isComplex()) {
      this.contours.forEach(contour => {
        pI.beginContour();
        contour.forEach(pt => pI.vertex(...pt));
        pI.endContour();
      });
    }
    pI.endShape('close');
  }
  private _drawF(oFunc: vecFunc, cFunc?: vecFunc) {
    this.polygon.forEach(pt => oFunc(pt[0], pt[1]));
    if (this.isComplex() && cFunc) {
      this.contours.forEach(contour => {
        contour.forEach(pt => cFunc(...pt));
      });
    }
  }
}
export class NoiseLoop {
  diameter: number;
  min: number;
  max: number;
  xC: number;
  yC: number;

  constructor( private p: p5, diam: number, min: number, max: number ) {
    this.diameter = diam;
    this.min = min;
    this.max = max;
    this.xC = p.random( 5000 );
    this.yC = p.random( 5000 );
  }
  get( a: number ) {
    let p = this.p;
   let xOff = this.p.map( this.p.cos( a ), -1, 1, 0, this.diameter );
    let yOff = this.p.map( this.p.sin( a ), -1, 1, 0, this.diameter );
    return p.map( p.noise( this.xC + xOff, this.yC + yOff ), 0, 1, this.min, this.max );
  }
}
