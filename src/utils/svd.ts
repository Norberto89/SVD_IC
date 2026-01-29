import { Matrix, SingularValueDecomposition } from 'ml-matrix';

export interface SVDResult {
    u: Float32Array;
    s: Float32Array;
    v: Float32Array;
    rows: number;
    cols: number;
}

/**
 * Compute SVD decomposition for a 2D matrix
 */
export function computeSVDData(data: Float32Array, rows: number, cols: number): SVDResult {
    // ml-matrix internal storage is 1D array of type Float64Array
    // Using from1DArray is faster than creating from number[][]
    const matrix = Matrix.from1DArray(rows, cols, data as unknown as number[]);
    const svd = new SingularValueDecomposition(matrix);

    // We flatten the matrices into Float32Array for better performance
    // and to use Transferables when sending to/from workers
    const u = svd.leftSingularVectors;
    const v = svd.rightSingularVectors;
    const s = svd.diagonal;

    return {
        u: new Float32Array(u.to1DArray()),
        s: new Float32Array(s),
        // OPTIMIZATION: Store V transposed (V^T) to make reconstruction contiguous in memory
        v: new Float32Array(v.transpose().to1DArray()),
        rows: u.rows,
        cols: v.rows
    };
}

/**
 * Reconstruct matrix from SVD components using only first k singular values
 * Uses optimized flat array operations with contiguous memory access for maximal performance
 */
export function reconstructMatrixFromData(svd: SVDResult, k: number, target: Float32Array): void {
    const { u, s, v: vt, rows, cols } = svd;
    const sLen = s.length;
    const limitedK = Math.min(k, sLen);

    // Optimized matrix multiplication: R = U * S * V^T
    // Reset target for the common case where it's reused
    target.fill(0);

    for (let i = 0; i < rows; i++) {
        const iRows = i * sLen;
        const iCols = i * cols;

        for (let m = 0; m < limitedK; m++) {
            const valUS = u[iRows + m] * s[m]; // U[i][m] * S[m]
            const mCols = m * cols; // Offset for the m-th row of V^T

            // This inner loop now iterates over contiguous memory for both 'target' and 'vt'
            // which is much more cache-friendly and allows JS engines to optimize better
            for (let j = 0; j < cols; j++) {
                target[iCols + j] += valUS * vt[mCols + j];
            }
        }
    }
}


/**
 * Extract RGB channels from ImageData as flat Float32Arrays for SVD input
 * Optimized to lead to faster SVD processing by using native TypedArrays
 */
export function getImageDataChannels(imageData: ImageData): { r: Float32Array, g: Float32Array, b: Float32Array } {
    const { width, height, data } = imageData;
    const size = width * height;

    const r = new Float32Array(size);
    const g = new Float32Array(size);
    const b = new Float32Array(size);

    for (let i = 0; i < size; i++) {
        const idx = i << 2;
        r[i] = data[idx];
        g[i] = data[idx + 1];
        b[i] = data[idx + 2];
    }

    return { r, g, b };
}

