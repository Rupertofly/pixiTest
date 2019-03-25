import p5 from 'p5';

export default class Noise {
    xCen: number;
    yCen: number;
    diam: number;
    thisFunc: ( x: number, y: number ) => number;
    private _isp5: boolean;
    constructor( func: ( x: number, y: number ) => number, diam: number );
    constructor( p: p5, diam: number );
    constructor( ...args:any) {
        if ( args[0] instanceof p5 ) {
            let p: p5 = args[0] as p5;
          this.thisFunc = ( x: number, y: number ) => p.noise( x, y );
          this._isp5 = true;

        } else {
          this.thisFunc = args[0];
          this._isp5 = false;
        }
      this.diam = args[1];
      this.xCen = Math.floor( Math.random() * 1000 );
      this.yCen = Math.floor( Math.random() * 1000 );

    }
    get isP5() {
        return this._isp5;
    }

}