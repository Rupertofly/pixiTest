declare module 'flubber' {
  interface Options {
    string?: boolean;
    maxSegmentLength?: number;
  }
  interface FOptions extends Options {
    string: false;
  }
  type loop = Array<[number, number]>;
  type shape = loop | string;
  export function interpolate( fShape: shape, tShape: shape, options: FOptions ): (t:number) => loop;
  export function interpolate( fShape: shape, tShape: shape, options?: Options ): ( t: number ) => string;

}
