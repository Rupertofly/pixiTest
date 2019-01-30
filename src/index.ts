
// P5 Sketch
import p5 from 'p5';
import bs from '../modules/bSpline';
import { VorCell } from '../modules/myVoronoi';
import Sketch from './sketch';
const c = new VorCell( 1, 2,'3' );
const instance = new p5( is => {
  console.log(bs.toString());

  Object.entries(new Sketch(is)).map(f => {
    is[f[0]] = f[1];
  });
});
