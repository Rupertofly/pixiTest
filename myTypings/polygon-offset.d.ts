
declare module 'polygon-offset' {
  export default class Offset {
    constructor();
    public data( points: loop ): this;
    public arcSegments( segments: number ): this;
    public margin( offset: number ): loop[];
    public padding( offset: number ): loop[];
    public offset( offset: number ): loop[];
    public offsetLine( offset: number ): loop[];

  }
}
