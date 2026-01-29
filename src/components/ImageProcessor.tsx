import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, BookOpen, Info, Loader2 } from 'lucide-react';
import { reconstructMatrixFromData, getImageDataChannels } from '../utils/svd';
import type { SVDResult } from '../utils/svd';
import SVDWorker from '../utils/worker?worker';

interface ChannelSVD {
    r: SVDResult;
    g: SVDResult;
    b: SVDResult;
}

// Constants
const MAX_DIM = 1000;
const FACT_INTERVAL_MS = 5000;

// Helper function to calculate resized dimensions
const getResizedDimensions = (w: number, h: number, maxDim: number): [number, number] => {
    if (w > h) {
        if (w > maxDim) {
            return [maxDim, Math.round((h * maxDim) / w)];
        }
    } else {
        if (h > maxDim) {
            return [Math.round((w * maxDim) / h), maxDim];
        }
    }
    return [w, h];
};

export const ImageProcessor: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
    const [channelsSVD, setChannelsSVD] = useState<ChannelSVD | null>(null);
    const [k, setK] = useState<number>(20);
    const [maxK, setMaxK] = useState<number>(100);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [currentFact, setCurrentFact] = useState<number>(0);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const originalCanvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const workerRef = useRef<Worker | null>(null);

    // Pre-allocated buffers for reconstructed channels to avoid GC pressure
    const rRecRef = useRef<Float32Array | null>(null);
    const gRecRef = useRef<Float32Array | null>(null);
    const bRecRef = useRef<Float32Array | null>(null);

    // Memoize facts array to prevent recreations
    const facts = useMemo(() => [
        "¿Sabías que el término 'Matriz' fue acuñado por James Joseph Sylvester en 1850?",
        "La SVD se utiliza en Netflix para recomendarte películas (filtrado colaborativo).",
        "Toda matriz, sin importar su forma, tiene una Descomposición en Valores Singulares.",
        "Los valores singulares en la diagonal de Sigma siempre son reales y no negativos.",
        "Google usa PageRank (basado en álgebra matricial) para clasificar la web.",
        "En computación cuántica, las compuertas lógicas son matrices unitarias.",
        "La compresión SVD es la base del PCA (Análisis de Componentes Principales).",
        "El procesamiento de señales en Marte usa SVD para limpiar el ruido de las fotos.",
        "La SVD puede separar la voz de un cantante del ruido de fondo en una grabación.",
        "En medicina, la SVD ayuda a reconstruir imágenes de resonancias magnéticas (MRI).",
        "Un 'rango bajo' en SVD captura la esencia estructural de una imagen compleja.",
        "Los valores singulares actúan como los 'genes' que definen la geometría de la matriz.",
        "La SVD ayudó a corregir las imágenes borrosas del Telescopio Hubble en sus inicios.",
        "En inteligencia artificial, la SVD se usa para comprimir modelos de lenguaje gigantes.",
        "El teorema de Eckart-Young garantiza que la SVD reducida es la mejor aproximación posible.",
        "La SVD se usa en geología para analizar ondas sísmicas y encontrar yacimientos.",
        "Los sistemas de reconocimiento facial usan SVD para crear 'Eigenfaces' o caras base.",
        "La SVD es fundamental en la búsqueda semántica para entender el significado del texto.",
        "En arqueología, se usa SVD para resaltar estructuras ocultas en fotos satelitales.",
        "La SVD puede detectar 'Deepfakes' analizando inconsistencias en los valores singulares.",
        "Se utiliza en meteorología para identificar patrones climáticos como 'El Niño'.",
        "En el análisis de ADN, la SVD ayuda a encontrar patrones genéticos entre poblaciones.",
        "La SVD es usada en criptoanálisis para romper ciertos tipos de cifrados clásicos.",
        "El concepto de SVD fue descubierto independientemente por Beltrami y Jordan en 1870.",
        "En robótica, la SVD ayuda a calcular cuánto puede estirarse y girar un brazo mecánico.",
        "La SVD es el método más fiable para calcular la 'Pseudo-inversa' de una matriz.",
        "En redes sociales, la SVD ayuda a identificar comunidades y grupos de interés.",
        "En minería de textos, la SVD permite que las computadoras 'entiendan' sinónimos.",
        "Los valores singulares representan los semiejes de una hiper-elipse en N dimensiones.",
        "SVD ayuda a alinear modelos 3D de objetos escaneados en ingeniería.",
        "En economía, ayuda a separar tendencias complejas de mercado de fluctuaciones puramente ruidosas.",
        "El rango de una matriz es exactamente igual al número de sus valores singulares distintos de cero.",
        "Se usa para detectar fallos estructurales en puentes mediante el análisis de vibraciones.",
        "En química, la SVD ayuda a determinar cuántas sustancias hay en una mezcla desconocida.",
        "La SVD se aplica para estabilizar videos eliminando movimientos bruscos de cámara.",
        "El 'número de condición' de una matriz, su sensibilidad a errores, se mide con la SVD.",
        "En analítica deportiva, la SVD ayuda a rankear equipos y predecir resultados de juegos.",
        "En oceanografía, ayuda a rastrear corrientes submarinas usando ondas de sonido.",
        "La SVD puede restaurar fotos antiguas estimando el núcleo de desenfoque original.",
        "En genética, los 'Eigengenes' se encuentran usando SVD para simplificar datos de expresión masiva.",
        "La tecnología MIMO de tu Wi-Fi usa SVD para maximizar la velocidad de transmisión.",
        "En finanzas, la SVD ayuda a optimizar carteras de inversión analizando riesgos.",
        "Ayuda a detectar duplicados en bases de datos masivas comparando 'huellas' matriciales.",
        "En astronomía, se usa SVD para detectar exoplanetas analizando el bamboleo de las estrellas.",
        "La SVD puede separar el 'estilo' del 'contenido' en arte digital y generación de fuentes.",
        "En lingüística, ayuda a mapear cómo las lenguas evolucionan y cambian a través del tiempo.",
        "En videojuegos, la SVD se usa para la animación fluida de las articulaciones de los personajes.",
        "El algoritmo SVD es considerado uno de los 'Top 10 Algoritmos del Siglo' en ciencia computacional.",
        "La SVD permite resolver sistemas de ecuaciones donde hay más incógnitas que datos.",
        "Incluso tu cerebro realiza procesos 'similares' a la SVD para filtrar estímulos irrelevantes."
    ], []);

    // Memoize compression ratio calculation
    const compressionRatio = useMemo(() => {
        if (!originalCanvasRef.current) return 0;
        const w = originalCanvasRef.current.width;
        const h = originalCanvasRef.current.height;
        if (w === 0 || h === 0) return 0;
        const originalSize = w * h;
        const compressedSize = k * (w + h + 1);
        return 1 - (compressedSize / originalSize);
    }, [k, channelsSVD]); // Recalculate when k or SVD data changes

    // Facts interval logic
    useEffect(() => {
        if (!isProcessing) {
            return;
        }

        // Pick a random starting fact
        setCurrentFact(Math.floor(Math.random() * facts.length));

        const interval = window.setInterval(() => {
            setCurrentFact(prev => (prev + 1) % facts.length);
        }, FACT_INTERVAL_MS);
        return () => window.clearInterval(interval);
    }, [isProcessing, facts.length]);

    // Initialize Web Worker
    useEffect(() => {
        workerRef.current = new SVDWorker();
        workerRef.current.onmessage = (e) => {
            const { rSVD, gSVD, bSVD } = e.data;

            // Initialize reconstruction buffers when SVD is ready
            const size = rSVD.rows * rSVD.cols;
            rRecRef.current = new Float32Array(size);
            gRecRef.current = new Float32Array(size);
            bRecRef.current = new Float32Array(size);

            setChannelsSVD({ r: rSVD, g: gSVD, b: bSVD });
            setIsProcessing(false);
        };
        return () => workerRef.current?.terminate();
    }, []);

    // Add blur effect to main page when processing
    useEffect(() => {
        const rootElement = document.getElementById('root');
        if (!rootElement) return;

        if (isProcessing) {
            rootElement.style.filter = 'blur(8px)';
            rootElement.style.transition = 'filter 0.3s ease-in-out';
        } else {
            rootElement.style.filter = 'none';
        }

        return () => {
            rootElement.style.filter = 'none';
        };
    }, [isProcessing]);

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const [w, h] = getResizedDimensions(img.width, img.height, MAX_DIM);
                setOriginalImage(img);
                processInitialImage(img, w, h);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    }, []);

    const processInitialImage = useCallback((img: HTMLImageElement, w: number, h: number) => {
        setIsProcessing(true);
        setChannelsSVD(null);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);

        const imageData = ctx.getImageData(0, 0, w, h);
        const { r, g, b } = getImageDataChannels(imageData);

        const mK = Math.min(w, h);
        setMaxK(mK);
        setK(Math.max(1, Math.floor(mK * 0.1)));

        // Usamos Transferables para evitar la clonación de grandes arreglos de datos
        workerRef.current?.postMessage(
            { r, g, b, rows: h, cols: w },
            [r.buffer, g.buffer, b.buffer]
        );
    }, []);

    const applyCompression = useCallback(() => {
        if (!channelsSVD || !canvasRef.current || !maxK) return;
        if (!rRecRef.current || !gRecRef.current || !bRecRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false }); // Optimization: no alpha
        if (!ctx) return;

        const { width: w, height: h } = canvas;

        // Reconstruct channels into the pre-allocated buffers
        reconstructMatrixFromData(channelsSVD.r, k, rRecRef.current);
        reconstructMatrixFromData(channelsSVD.g, k, gRecRef.current);
        reconstructMatrixFromData(channelsSVD.b, k, bRecRef.current);

        // Create image data and fill in one pass
        const newImageData = ctx.createImageData(w, h);
        const data = newImageData.data;

        const rRec = rRecRef.current;
        const gRec = gRecRef.current;
        const bRec = bRecRef.current;
        const totalPixels = w * h;

        // Super optimized loop: one flat traversal
        for (let i = 0; i < totalPixels; i++) {
            const idx = i << 2;
            const r = rRec[i];
            const g = gRec[i];
            const b = bRec[i];

            data[idx] = r < 0 ? 0 : r > 255 ? 255 : r | 0;
            data[idx + 1] = g < 0 ? 0 : g > 255 ? 255 : g | 0;
            data[idx + 2] = b < 0 ? 0 : b > 255 ? 255 : b | 0;
            data[idx + 3] = 255;
        }

        ctx.putImageData(newImageData, 0, 0);
    }, [channelsSVD, k, maxK]);

    // Draw original image when it changes
    useEffect(() => {
        if (!originalImage || !originalCanvasRef.current) return;

        const canvas = originalCanvasRef.current;
        const [w, h] = getResizedDimensions(originalImage.width, originalImage.height, MAX_DIM);

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(originalImage, 0, 0, w, h);

        // Also set result canvas size
        if (canvasRef.current) {
            canvasRef.current.width = w;
            canvasRef.current.height = h;
        }
    }, [originalImage]);

    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (channelsSVD) {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => {
                applyCompression();
            });
        }
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [channelsSVD, k, applyCompression]);

    return (
        <div className="container-wide space-y-12 pb-20">
            {createPortal(
                <AnimatePresence>
                    {isProcessing && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-[#060610] flex flex-col items-center justify-center z-[9999] p-4 text-center overflow-hidden"
                            style={{ pointerEvents: 'auto', height: '100vh', maxHeight: '100dvh' }}
                        >
                            {/* Animated Background Orbs */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.3, 1],
                                        opacity: [0.1, 0.25, 0.1],
                                        x: [-200, 200, -200],
                                        y: [-100, 100, -100]
                                    }}
                                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                                    className="absolute top-1/4 -left-40 w-[800px] h-[800px] bg-accent/20 rounded-full blur-[140px]"
                                />
                                <motion.div
                                    animate={{
                                        scale: [1.3, 1, 1.3],
                                        opacity: [0.15, 0.2, 0.15],
                                        x: [200, -200, 200],
                                        y: [100, -100, 100]
                                    }}
                                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                                    className="absolute bottom-1/4 -right-40 w-[700px] h-[700px] bg-purple-500/10 rounded-full blur-[120px]"
                                />
                            </div>
                            {/* Content Panel with Frosted Glass */}
                            <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center px-4">
                                <motion.div
                                    className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] sm:rounded-[4rem] p-8 sm:p-16 shadow-[0_0_100px_rgba(0,0,0,0.6)] overflow-hidden w-full"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                >
                                    {/* Scanning Light Effect */}
                                    <motion.div
                                        animate={{ y: ['-100%', '300%'] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-x-0 h-1/4 bg-gradient-to-b from-transparent via-accent/5 to-transparent pointer-events-none"
                                    />


                                    {/* Animation Display Box */}
                                    <div className="relative mb-8 sm:mb-12 mx-auto w-48 h-64 sm:w-64 sm:h-84 bg-black/60 rounded-[2.5rem] sm:rounded-[3.5rem] border border-white/10 flex flex-col items-center justify-between py-8 sm:py-12 px-6 shadow-2xl overflow-hidden group">
                                        <div className="absolute inset-x-0 top-0 h-1/2 bg-accent/5 opacity-50 blur-3xl group-hover:opacity-80 transition-opacity" />

                                        <div className="relative w-full flex-grow flex items-center justify-center">
                                            <motion.div
                                                animate={{ rotate: -360, scale: [1, 1.05, 1] }}
                                                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                                                className="absolute w-44 h-44 bg-blue-500/30 border-2 border-blue-400/50 rounded-[2.5rem]"
                                            />
                                            <motion.div
                                                animate={{ rotate: 360, scale: [1.05, 1, 1.05] }}
                                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                                className="absolute w-36 h-36 bg-green-500/30 border-2 border-green-400/40 rounded-[2.5rem]"
                                            />
                                            <motion.div
                                                animate={{ rotate: -360, scale: [1, 1.1, 1] }}
                                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                                className="absolute w-28 h-28 bg-red-500/30 border-2 border-red-400/40 rounded-2xl shadow-[0_0_40px_rgba(239,68,68,0.25)]"
                                            />
                                        </div>

                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                            className="relative z-10 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] pb-2"
                                        >
                                            <Loader2 size={64} className="sm:w-20 sm:h-20" />
                                        </motion.div>
                                    </div>

                                    {/* Text Content */}
                                    <div className="space-y-6 mb-12">
                                        <div className="space-y-2">
                                            <motion.h3
                                                animate={{ opacity: [0.8, 1, 0.8] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="text-3xl sm:text-4xl font-bold tracking-tight text-white serif"
                                            >
                                                Descomponiendo Matrices
                                            </motion.h3>
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-red-400/40" />
                                                <p className="text-white/40 font-mono text-xs uppercase tracking-[0.4em] font-bold">
                                                    <span className="text-red-400">R</span> • <span className="text-green-400">G</span> • <span className="text-blue-400">B</span>
                                                </p>
                                                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-blue-400/40" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Facts Carousel */}
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentFact}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -15 }}
                                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                            className="relative p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden group/fact"
                                        >
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-accent/40 group-hover/fact:bg-accent transition-colors" />
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                                    <BookOpen size={14} />
                                                </div>
                                                <span className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">¿Sabías que...?</span>
                                            </div>
                                            <p className="text-base sm:text-lg font-serif italic text-white/90 leading-relaxed text-left">
                                                "{facts[currentFact]}"
                                            </p>
                                        </motion.div>
                                    </AnimatePresence>

                                    {/* Progress Status */}
                                    <div className="mt-12 flex flex-col items-center gap-4">
                                        <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                                            <motion.div
                                                animate={{ x: ['-100%', '200%'] }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-accent to-transparent"
                                            />
                                        </div>
                                        <p className="text-[10px] uppercase tracking-[0.5em] text-white/20 font-bold animate-pulse">
                                            Procesando capas singulares
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.getElementById('loading-portal')!
            )}

            {/* Controls Bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 shadow-2xl"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold flex items-center gap-3 serif">
                            <span className="w-10 h-10 bg-accent/20 rounded-2xl flex items-center justify-center text-accent">
                                <Upload size={20} />
                            </span>
                            Panel de Experimentación
                        </h2>
                        <p className="text-dim text-sm max-w-xs">Ajusta el rango <strong>k</strong> para observar cómo se pierden las capas de información de la matriz.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-primary"
                        >
                            <Upload size={18} /> Nueva Imagen
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="sr-only"
                            accept="image/*"
                            onChange={handleFileUpload}
                        />

                        {channelsSVD && (
                            <button
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.download = `SVD-Compressed-k${k}.png`;
                                    link.href = canvasRef.current?.toDataURL() || '';
                                    link.click();
                                }}
                                className="btn-primary group relative overflow-hidden"
                                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
                                <Download size={18} className="relative z-10" />
                                <span className="relative z-10">Descargar Resultado</span>
                            </button>
                        )}
                    </div>
                </div>

                {channelsSVD && originalCanvasRef.current && (
                    <>
                        <div className="mt-4 pt-2 border-t border-white/5 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                            {/* K Slider Section */}
                            <div className="lg:col-span-12">
                                <div className="p-4 sm:p-8 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <label className="blog-subheading mb-0 opacity-80">Rango de Aproximación (k)</label>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-mono font-bold text-accent">{k}</span>
                                            <span className="text-dim text-xs font-mono">/ {maxK}</span>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <input
                                            type="range"
                                            min="1"
                                            max={maxK}
                                            value={k}
                                            onChange={(e) => setK(parseInt(e.target.value))}
                                        />
                                        <div className="flex justify-between mt-4 text-[10px] uppercase tracking-widest text-dim font-bold">
                                            <span>Baja Fidelidad</span>
                                            <span>Máxima Fidelidad</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Section */}
                        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex flex-col justify-between group hover:border-accent/40 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-dim text-[10px] uppercase tracking-widest font-bold">Ahorro Estimado</span>
                                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                                        <Download size={14} />
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-3xl sm:text-5xl font-bold font-mono ${compressionRatio >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {Math.floor(compressionRatio * 100)}%
                                    </span>
                                </div>
                                <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(0, compressionRatio * 100)}%` }}
                                        className="h-full bg-green-400"
                                    />
                                </div>
                            </div>

                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex flex-col justify-between group hover:border-accent/40 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-dim text-[10px] uppercase tracking-widest font-bold">Valores a Guardar</span>
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50">
                                        <div className="flex gap-0.5">
                                            <div className="w-1 h-3 bg-red-400/60" />
                                            <div className="w-1 h-3 bg-green-400/60" />
                                            <div className="w-1 h-3 bg-blue-400/60" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-dim uppercase tracking-wider">Original:</span>
                                        <span className="text-xl font-bold font-mono text-white/70">
                                            {(((originalCanvasRef.current?.width || 0) * (originalCanvasRef.current?.height || 0) * 3) / 1000).toFixed(0)}K <span className="text-[10px] font-normal uppercase opacity-60">vals</span>
                                        </span>
                                    </div>
                                    <div className="h-px w-full bg-white/5" />
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-accent font-bold uppercase tracking-wider">SVD (k={k}):</span>
                                        <span className="text-xl font-bold font-mono text-accent">
                                            {((k * ((originalCanvasRef.current?.width || 0) + (originalCanvasRef.current?.height || 0) + 1) * 3) / 1000).toFixed(0)}K <span className="text-[10px] font-normal uppercase opacity-60">vals</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div className="mt-8 pt-6 border-t border-white/5 flex items-start gap-3 px-2">
                    <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-accent mt-0.5 shrink-0">
                        <Info size={12} />
                    </div>
                    <p className="text-[11px] text-dim leading-relaxed">
                        <strong>Nota:</strong> Cargar una imagen muy grande aumentará el tiempo de procesamiento. La descarga del resultado solo guarda la representación visual de la compresión, más no los datos matemáticos de la SVD reducida.
                    </p>
                </div>
            </motion.div>

            {/* Image Comparison Grid */}
            {originalImage ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                    >
                        <h3 className="blog-subheading px-2">Original</h3>
                        <div className="glass-card p-2 rounded-3xl overflow-hidden border-accent/10">
                            <div className="relative aspect-auto bg-black/40 rounded-2xl overflow-hidden">
                                <canvas ref={originalCanvasRef} className="w-full h-auto block" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                    >
                        <h3 className="blog-subheading px-2">Resultado SVD (k={k})</h3>
                        <div className="glass-card p-2 rounded-3xl overflow-hidden border-accent/20 ring-1 ring-accent/20">
                            <div className="relative aspect-auto bg-black/40 rounded-2xl overflow-hidden">
                                <canvas ref={canvasRef} className="w-full h-auto block" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card pt-16 sm:pt-32 pb-12 sm:pb-24 px-6 sm:px-12 text-center border-dashed border-white/10"
                >
                    <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 text-accent">
                        <Upload size={40} />
                    </div>
                    <h3 className="text-2xl font-bold serif mb-2">Comienza el Experimento</h3>
                    <p className="text-dim max-w-sm mx-auto">Sube una imagen para descomponerla en sus componentes fundamentales (Valores Singulares).</p>
                </motion.div>
            )}
        </div>
    );
};
