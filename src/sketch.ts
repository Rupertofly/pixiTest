// #region Imports
import * as d3 from 'd3';
import * as F from 'flubber';
import { JoinType } from 'js-clipper';
import p5 from 'p5';
import MyPolygon from '../modules/MyPolygon';
import Noise from '../modules/noise';
import * as UT from '../modules/utils';

// #endregion

// #region Types

interface Site {
  position: p5.Vector;
  firstPos: p5.Vector;
  color: string;
  poly: MyPolygon;
  prePoly: MyPolygon;
  noiseX?: Noise;
  noiseY?: Noise;
}
//#endregion
const Vec = p5.Vector;
const [WID, HEI] = [720, 720];
const Voronoi = d3
  .voronoi<Site>()
  .size([WID, HEI])
  .x(s => s.position.x)
  .y(s => s.position.y).polygons;
const mySites: Site[] = d3.range(512).map(i => ({
  position: new Vec().set(Math.random() * WID, Math.random() * HEI),
  firstPos: new Vec(),
  color: d3.interpolateCubehelixDefault(i / 256),
  poly: new MyPolygon([[1, 1], [1, 0], [0, 1]]),
  prePoly: new MyPolygon([[1, 1], [1, 0], [0, 1]])
}));
let cc = new CCapture({
  format: 'webm',
  framerate: 30,
  name: 'greens'
});
export default async function sketch(p: p5) {
  // Start

  // Setup
  p.setup = () => {
    mySites.map(site => {
      site.noiseX = new Noise(p, 0.2);
      site.noiseY = new Noise(p, 0.2);
    });
    p.createCanvas(WID, HEI);
    p.background(55);
    document.getElementsByTagName('body')[0].style.margin = '0px';
    d3.range(200).map(() => {
      Voronoi(mySites).map(pg => {
        let c = d3.polygonCentroid(pg);
        pg.data.position.set(c);
        pg.data.firstPos.set(c);
      });
    });
    Voronoi( mySites ).map( pgon => {
      let d = pgon.data;
      if ( !d.noiseX || !d.noiseY ) return;

      pgon.data.position = p5.Vector.add( pgon.data.firstPos, p.createVector( d.noiseX.get( 0 )*200, d.noiseY.get( 0 )*200 ) );
    });
  };
  // Draw

  p.draw = () => {
    p.background(55);
    Voronoi( mySites ).map( pgon => {
      let d = pgon.data;
      d.poly = new MyPolygon(pgon);
      p.fill(d3.interpolateGreens(d.position.y / HEI));
      p.stroke( d3.interpolateGreens( d.position.y / HEI ) );
      p.strokeWeight( 3 );
      document.title = p.frameRate().toPrecision( 3 );
      if ( !d.noiseX || !d.noiseY ) return;
      d.position = p5.Vector.add( d.firstPos, p.createVector( (d.noiseX.get(p.frameCount/300 - p.floor(p.frameCount/300))-0.5)*200, (d.noiseX.get( (p.frameCount % 360) / 360 )-0.5)*200) );
      let newPoly = new MyPolygon(
        F.interpolate(
          pgon.data.poly.polygon,
          // @ts-ignore
          new MyPolygon( d.poly.polygon ).offset( -50 ).smooth( 4, 20 ).polygon,
          {
            string: false
          }
        )(
          p.sin( ( p.frameCount - pgon.data.position.y / 3 ) / ( 10 * p.TWO_PI ) ) /
          2 +
          0.6
        )
      );
      new MyPolygon( F.interpolate( d.poly.polygon, newPoly.polygon, { string: false } )( 0.7 ) ).draw( p );
      d.poly = newPoly;
    });
  };
}
