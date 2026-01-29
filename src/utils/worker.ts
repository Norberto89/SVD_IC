import { computeSVDData } from './svd';

// Define the worker's self context correctly as any to bypass complex worker types
const ctx: any = self;

ctx.onmessage = (e: MessageEvent) => {
    const { r, g, b, rows, cols } = e.data;

    // Perform heavy SVD computation in the background thread
    const rSVD = computeSVDData(r, rows, cols);
    const gSVD = computeSVDData(g, rows, cols);
    const bSVD = computeSVDData(b, rows, cols);

    // Use Transferables to avoid structured clone overhead
    ctx.postMessage({ rSVD, gSVD, bSVD }, [
        rSVD.u.buffer, rSVD.s.buffer, rSVD.v.buffer,
        gSVD.u.buffer, gSVD.s.buffer, gSVD.v.buffer,
        bSVD.u.buffer, bSVD.s.buffer, bSVD.v.buffer
    ]);
};

