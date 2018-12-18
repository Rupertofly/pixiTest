import p5 from 'p5';
import Sketch from './sketch';
let instance = new p5(instance => {
  Object.entries(new Sketch(instance)).map(m => {
    instance[m[0]] = m[1];
  });
});
