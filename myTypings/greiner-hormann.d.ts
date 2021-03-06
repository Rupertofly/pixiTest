/** Declaration file generated by dts-gen */
declare module 'greiner-hormann' {
    type arrPT = [number, number];
    type objPT = { x: number; y: number };
    type aPTpg = arrPT[];
    type oPTpg = objPT[];
    export function clip(
        polygonA: any,
        polygonB: any,
        eA: any,
        eB: any
    ): any;

    export function diff<T extends aPTpg | oPTpg>(
        polygonA: T,
        polygonB: T
    ): T[];

    export function intersection<
        T extends aPTpg | oPTpg
    >(polygonA: T, polygonB: T): T[];

    export function union<
        T extends aPTpg | oPTpg
    >(polygonA: T, polygonB: T): T[];
}
