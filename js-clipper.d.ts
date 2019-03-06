/* tslint:disable:class-name interface-name */

declare module 'js-clipper' {
    interface IntPoint {
        X: number;
        Y: number;
    }
    type path = IntPoint[];
    type paths = path[];
    export enum ClipType {
        ctIntersection = 0,
        ctUnion = 1,
        ctDifference = 2,
        ctXor = 3
    }
    export enum PolyFillType {
        pftEvenOdd,
        pftNonZero,
        pftPositive,
        pftNegative
    }
    export enum PolyType {
        ptSubject,
        ptClip
    }
    export enum JoinType {
        jtSquare,
        jtRound,
        jtMiter
    }
    export enum EndType {
        etOpenSquare,
        etOpenRound,
        etOpenButt,
        etClosedLine,
        etClosedPolygon
    }

    export namespace JS {
        function Clean(path: path, amount: number): path;
        function Clean(path: paths, amount: number): paths;
        function ExPolygonsToPaths(ExPoly: ExPolygon[]): paths;
        function PolyTreeToExPolygons(
            PolyTree: PolyTree | PolyNode
        ): ExPolygon[];
    }
    export class Clipper {
        public static SimplifyPolygons(
            paths: paths,
            fillType: PolyFillType
        ): paths;
        public static CleanPolygon(path: path, amount: number): path;
        public static CleanPolygons(path: paths, amount: number): paths;
        constructor();
        public AddPath(path: path, type: PolyType, closed: boolean): void;
        public AddPaths(paths: paths, type: PolyType, closed: boolean): void;
        public Execute(
            clipType: ClipType,
            solution: path | paths | PolyTree,
            subFillType?: PolyFillType,
            clipFillType?: PolyFillType
        ): boolean;
    }
    export class PolyNode {
        constructor();
        public Contour(): path;
        public IsHole(): boolean;
        public Childs(): PolyNode[];
    }
    export class PolyTree extends PolyNode {
        constructor();
        public GetFirst(): PolyNode;
    }
    export class ClipperOffset {
        constructor();
        public AddPath(path: path, join: JoinType, end: EndType): void;
        public AddPaths(path: paths, join: JoinType, end: EndType): void;
        public Execute(solution: path | paths, amount: number): boolean;
    }
    interface ExPolygon {
        outer: null | path;
        holes: null | paths;
    }
    export function ExPolygon(): ExPolygon;
    export function ExPolygons(): ExPolygon[];
}
