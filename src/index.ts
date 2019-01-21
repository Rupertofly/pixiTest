import p5 from 'p5';
import Sketch from './sketch';
const instance = new p5(is => {
  Object.entries(new Sketch(is)).map(f => {
    is[f[0]] = f[1];
  });
});
