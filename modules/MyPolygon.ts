import * as cl from 'js-clipper';
import _ from 'lodash';
import p5 from 'p5';
import { JSClipperHelper, polygonNamespace } from './utils';
type vecFunc = ( x: number, y: number ) => void;
type point = [number, number];
type lp = point[];
export default class MyPolygon {
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
        return [this];
      } else {
        let wkEx = this.FromJSExPoly(resEx[0]);
        this.polygon = wkEx.polygon;
        this.contours = wkEx.contours;
        let op: MyPolygon[] = [];
        if (resEx.length > 1) {
          for (let i = 1; i < resEx.length; i++) {
            op.push(new MyPolygon(resEx[i]));
          }
        }
        return [this, ...op];
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
