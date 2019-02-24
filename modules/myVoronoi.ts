import *  as Pol from 'd3-polygon';
import * as Vor from 'd3-voronoi';
import _ from 'lodash';
import p5 from 'p5';

type myPG = Vor.VoronoiPolygon<VorCell>;

export class VorDiagram {
    public layoutFunction: Vor.VoronoiLayout<VorCell>;
    public count: number;
    public cells: VorCell[] = [];
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
        });
    }
    public relax(count: number) {
        for (let i = 0; i < count; i++) {
            this.cells.forEach( cell => cell.relaxCell() );
        }
        this.refresh();
    }
}
export class VorCell {
    public position: p5.Vector;
    public polygon?: myPG;
    public centroid?: pt;
    public identifier: string;
    public colour?: string;

    constructor(x: number, y: number, i: string) {
        this.position = new p5.Vector().set(x, y);
        this.identifier = i;
    }
    public setPos(posArr: pt): this;
    public setPos(x: number, y: number): this;
    public setPos(...args: Array<number | pt>) {
        if (args.length > 1) {
            this.position.set(args[0] as number, args[1] as number);
            return this;
        }
        const point: pt = args[0] as pt;
        this.position.set(point[0] as number, point[1] as number);
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
}
