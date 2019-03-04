import * as Pol from 'd3-polygon';
import * as Vor from 'd3-voronoi';
import * as cl from 'js-clipper';
import _ from 'lodash';
import p5 from 'p5';
import * as UT from './utils';

type myPG = Vor.VoronoiPolygon<VorCell>;

export class VorDiagram {
    public layoutFunction: Vor.VoronoiLayout<VorCell>;
    public count: number;
    public cells: VorCell[] = [];
    public regions: VorRegion[] = [];
    public diagram: Vor.VoronoiDiagram<VorCell>;
    constructor(
        width: number,
        height: number,
        count?: number,
        random?: boolean
    ) {
        this.layoutFunction = Vor.voronoi<VorCell>()
            .size([width, height])
            .x((a: any) => a.x)
            .y((a: any) => a.y);
        this.count = count || Math.floor((width * height) / 30 ** 2);
        for (let i = 0; i < this.count; i++) {
            this.cells.push(
                new VorCell(
                    _.random(width, true),
                    _.random(height, true),
                    i.toString()
                )
            );
        }
        this.diagram = this.layoutFunction(this.cells);
        this.refresh();
    }
    public refresh() {
        this.diagram = this.layoutFunction(this.cells);
        this.diagram.polygons().map(polygon => {
            let cell = polygon.data;
            cell.setPolygon(polygon);
            cell.resetNeighbours();
        });
        this.diagram.links().map(link => {
            link.source.neighbours.push(link.target);
            link.target.neighbours.push(link.source);
        });
    }
    public relax(count: number) {
        for (let i = 0; i < count; i++) {
            this.cells.forEach(cell => cell.relaxCell());
        }
        this.refresh();
    }
    public getRegions(check: (seed: VorCell, candidate: VorCell) => boolean) {
        this.regions = [];
        let unVisited = [...this.cells];
        while (unVisited.length > 0) {
            let seed = unVisited.shift() as VorCell;
            let thisRegion = new VorRegion(seed);
            this.regions.push(thisRegion);
            if (!seed) break;
            let candidates = seed.neighbours.filter(value =>
                check(seed, value)
            );
            while (candidates.length > 0) {
                let candidate = candidates.shift() as VorCell;
                if ( !unVisited.includes( candidate ) ) continue;
                unVisited.splice(unVisited.indexOf(candidate), 1);
                thisRegion.addCell(candidate);
                let options = candidate.neighbours.filter(value =>
                    check(seed, value)
                );
                if ( options.length > 0 ) candidates.push( ...options );
            }
        }
    }
}
export class VorCell {
    public position: p5.Vector;
    public polygon?: myPG;
    public centroid?: pt;
    public identifier: string;
    public neighbours: VorCell[] = [];
    public colour?: string;
    public opts: { [i: string]: any };

    constructor(x: number, y: number, i: string) {
        this.position = new p5.Vector().set(x, y);
        this.identifier = i;
        this.opts = {};
    }
    public setPos(posArr: pt): this;
    public setPos(x: number, y: number): this;
    public setPos(...args: Array<number | pt>) {
        if (args.length > 1) {
            this.position.set(args[0] as number, args[1] as number);
            return this;
        }
        const point: pt = args[0] as pt;
        this.position.set(point[0], point[1]);
        return this;
    }
    get x() {
        return this.position.x;
    }
    get y() {
        return this.position.y;
    }
    public getCentroid() {
        if (!this.polygon) throw new Error('No Polygon Available');
        this.centroid = Pol.polygonCentroid(this.polygon);
        return this.centroid;
    }
    public setPolygon(pgon: Vor.VoronoiPolygon<VorCell>) {
        this.polygon = pgon;
        return this;
    }
    public relaxCell() {
        return this.setPos(this.getCentroid());
    }
    public resetNeighbours() {
        this.neighbours = [];
    }
}
export class VorRegion {
    public cells: VorCell[];
    private polygon: loop;
    constructor(firstCell: VorCell) {
        this.cells = [firstCell];
        this.polygon = firstCell.polygon ? firstCell.polygon : [];
    }
    public addCell(cell: VorCell) {
        this.cells.push(cell);
    }
    public getPolygon() {
        this.refreshPolygon();
        return this.polygon;
    }
    private refreshPolygon() {
        // Prepare Polygons for Joining
        const adjustedPolygons = this.cells.map(cell => {
            if (!cell.polygon) return;
            return UT.polygonNamespace.toClipperFormat(cell.polygon);
        }) as cl.paths;
        // Create new Clipper
        const clipper = new cl.Clipper();
        let solution = new cl.PolyTree();
        clipper.AddPaths(adjustedPolygons, cl.PolyType.ptSubject, true);
        clipper.Execute(
            cl.ClipType.ctUnion,
            solution,
            cl.PolyFillType.pftEvenOdd,
            cl.PolyFillType.pftEvenOdd
        );
        // console.log( solution );
        let outer = solution.GetFirst();
        this.polygon = UT.polygonNamespace.fromClipperFormat( outer.Contour() );
        // throw new Error("well this didn't work");
        // let output = solution.map(pgon => {
        //     return UT.polygonNamespace.fromClipperFormat(pgon);
        // });
        // return output;
    }
}
