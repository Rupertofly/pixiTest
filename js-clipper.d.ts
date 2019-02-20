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
    export class Clipper {
        constructor();
        public AddPath(path: path, type: PolyType, closed: boolean): void;
        public AddPaths(paths: paths, type: PolyType, closed: boolean): void;
        public Execute(
            clipType: ClipType,
            solution: path | paths,
            fillType?: PolyFillType
        ): boolean;
    }
}
