import * as d3 from 'd3';
import * as cl from 'js-clipper';
import _ from 'lodash';
import bSpline from './bSpline';

export namespace polygonNamespace {
    type pt = [number, number];
    type lp = pt[];
    function sqr(x: number) {
        return x * x;
    }
    function dist2(v: pt, w: pt) {
        return sqr(v[0] - w[0]) + sqr(v[1] - w[1]);
    }
    function distToSegmentSquared(p: pt, v: pt, w: pt) {
        const l2 = dist2(v, w);
        if (l2 === 0) return dist2(p, v);
        let t =
            ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) /
            l2;
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
    export function distToSegment(p: pt, v: pt, w: pt) {
        return Math.sqrt(distToSegmentSquared(p, v, w));
    }
    /**
     * Returns the minimum distance between the centroid of a polygon and an edge
     *
     * @param {[Number, Number][]} poly polygon
     *
     */
    export function getMinDist(poly: pt[]) {
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
}
export namespace JSClipperHelper {
    type pt = [number, number];
    type lp = pt[];
    export function cleanPolygon(polygon: lp, ammount: number) {
        let adjPoly = toClipperFormat(polygon);
        return fromClipperFormat(cl.JS.Clean(adjPoly, ammount * 10000));
    }
    export function joinPolygons(polygons: lp[]) {
        // Prepare Polygons for Joining
        const adjustedPolygons = polygons.map(poly => {
            return toClipperFormat(poly);
        });
        // Create new Clipper
        const clipper = new cl.Clipper();
        let solution: cl.paths = [[]];
        clipper.AddPaths(adjustedPolygons, cl.PolyType.ptSubject, true);
        clipper.Execute(
            cl.ClipType.ctUnion,
            solution,
            cl.PolyFillType.pftEvenOdd,
            cl.PolyFillType.pftEvenOdd
        );
        solution = cl.Clipper.SimplifyPolygons(
            solution,
            cl.PolyFillType.pftEvenOdd
        );
        let output = solution.map(pgon => {
            return fromClipperFormat(pgon);
        });
        return output;
    }
    export function offsetPolygon(poly: lp, ammount: number): lp {
        let adjustedPoly = toClipperFormat(poly);
        let amt = 1000 * ammount;
        const offset = new cl.ClipperOffset();
        let result: cl.IntPoint[][] = [];
        offset.AddPath(
            adjustedPoly,
            cl.JoinType.jtMiter,
            cl.EndType.etClosedPolygon
        );
        let success = offset.Execute(result, amt);
        if (!result[0]) return fromClipperFormat(adjustedPoly);
        else return fromClipperFormat(result[0]);
    }
    export function fromClipperFormat(polygon: cl.IntPoint[]): lp {
        return polygon.map(point => {
            return [point.X / 10000, point.Y / 10000] as pt;
        });
    }

    export function toClipperFormat(polygon: lp) {
        let thePoly = polygon.map(point => {
            return {
                X: Math.floor(point[0] * 10000),
                Y: Math.floor(point[1] * 10000)
            };
        });
        return thePoly;
    }
}
export class MyPolygon {
    public polygon: Array<[number, number]> = [];
    public contours?: Array<Array<[number, number]>>;

    constructor( polygon: loop | cl.ExPolygon | cl.PolyTree, contour?: loop[] ) {
        
        if (polygon instanceof cl.ExPolygon) {
            this.polygon = JSClipperHelper.fromClipperFormat(
                ( polygon as cl.ExPolygon ).outer || []
            ) || [];
            
        } else if (polygon instanceof cl.PolyTree) {
        } else if (_.isArray(polygon)) {
        } else {
            throw new Error('Wrong Type');
        }
    }
}
