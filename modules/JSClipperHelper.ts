import * as d3 from 'd3';
import * as cl from 'js-clipper';
import MyPolygon from './MyPolygon';
import { lp, point } from './utils';
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
      .sort((a, b) => d3.polygonArea(a.polygon) - d3.polygonArea(b.polygon))[0];
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
/**
 * clip polygons using js-clipper
 *
 * @export
 * @param {cl.ClipType} clipFunc clip type to use
 * @param {MyPolygon[]} subPoly subject polygons
 * @param {MyPolygon[]} clipPoly clipping polygons, use empty array for union
 * @param {boolean} [clean] clean and simplify before clipping
 * @param {number} [cleanLen] amount to clean by
 * @returns {MyPolygon[]} result
 */
export function clipPolygons(
  clipFunc: cl.ClipType,
  subPoly: MyPolygon[],
  clipPoly: MyPolygon[],
  clean?: boolean,
  cleanLen?: number
): MyPolygon[] {
  let wSub: cl.IntPoint[][] = subPoly.flatMap(pol => pol.toJSPaths());
  let wClip: cl.IntPoint[][] = clipPoly.flatMap(p => p.toJSPaths());
  if (clean) {
    wSub = subPoly.flatMap(pg => {
      let wP = cl.Clipper.CleanPolygons(
        pg.toJSPaths(),
        (cleanLen || 1.5) * 10000
      );
      wP = cl.Clipper.SimplifyPolygons(wP, cl.PolyFillType.pftEvenOdd);
      return wP;
    });
    wClip = subPoly.flatMap(pg => {
      let wP = cl.Clipper.CleanPolygons(
        pg.toJSPaths(),
        (cleanLen || 1.5) * 10000
      );
      wP = cl.Clipper.SimplifyPolygons(wP, cl.PolyFillType.pftEvenOdd);
      return wP;
    });
  }
  let Clip = new cl.Clipper();
  Clip.AddPaths(wSub, cl.PolyType.ptSubject, true);
  if (wClip.length) Clip.AddPaths(wClip, cl.PolyType.ptClip, true);
  let solution = new cl.PolyTree();
  Clip.Execute(
    clipFunc,
    solution,
    cl.PolyFillType.pftEvenOdd,
    cl.PolyFillType.pftEvenOdd
  );
  let result = cl.JS.PolyTreeToExPolygons(solution).map(
    ep => new MyPolygon(ep)
  );
  return result;
}
