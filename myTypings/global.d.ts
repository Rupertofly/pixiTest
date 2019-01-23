interface ICCaptureOptions {
    framerate?: number;
    format: 'webm' | 'png' | 'jpg';
    name?: string;
    verbose?: boolean;

}

declare class CCapture {
    constructor( opts: ICCaptureOptions );

    public start(): void;
    public stop(): void;
    public capture( canvas: CanvasRenderingContext2D ): void;
    public save( cb?: (blob:any)=>void ):void;
}
