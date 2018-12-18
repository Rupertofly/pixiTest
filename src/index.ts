import p5 from 'p5';
import Sketch from './sketch';
const instance = new p5(is => {
  Object.entries(new Sketch(is)).map(m => {
    is[m[0]] = m[1];
  });
});
