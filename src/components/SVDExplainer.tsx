import { motion } from 'framer-motion';
import { Lightbulb, BookOpen, Layers, Cpu, Sigma, Box } from 'lucide-react';

export const SVDExplainer = () => {
    return (
        <div className="container">
            <motion.article
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="blog-content"
            >
                {/* Categoría */}
                <div className="text-center mb-6">
                    <span className="blog-subheading flex items-center justify-center gap-2">
                        <BookOpen size={14} /> Laboratorio de Álgebra Lineal
                    </span>
                </div>

                {/* Título Principal */}
                <h1 className="blog-heading text-4xl md:text-5xl text-center mb-8">
                    Compresión de Imágenes: <br />
                    <span className="gradient-text">De Píxeles a Valores Singulares</span>
                </h1>

                <div className="space-y-16">
                    {/* PASO 1: El Objeto de Estudio */}
                    <section>
                        <h2 className="text-2xl font-bold mb-6 serif border-b border-white/5 pb-2 flex items-center gap-3">
                            <Box size={20} className="text-accent" />
                            1. La Imagen como Estructura de Datos
                        </h2>
                        <p className="blog-text">
                            Para aplicar el álgebra lineal, primero debemos ver la imagen como un objeto matemático. Una imagen digital es una rejilla de píxeles, pero hay un detalle crucial:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                            <div className="p-6 sm:p-8 bg-white/5 rounded-3xl border border-white/10 flex flex-col group hover:border-accent/40 transition-colors">
                                <h3 className="text-accent font-bold sans text-[10px] mb-4 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                    Multicanal (RGB)
                                </h3>
                                <p className="text-secondary text-sm leading-relaxed flex-grow">
                                    En una imagen a color, guardamos <strong>tres matrices independientes</strong>: una para el canal Rojo (R), otra para el Verde (G) y otra para el Azul (B). Al comprimir, realizamos la SVD en cada una de estas matrices de forma separada.
                                </p>
                            </div>
                            <div className="p-8 bg-white/5 rounded-3xl border border-white/10 flex flex-col group hover:border-accent/40 transition-colors">
                                <h3 className="text-accent font-bold sans text-[10px] mb-4 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                    Valores de Matriz
                                </h3>
                                <p className="text-secondary text-sm leading-relaxed flex-grow">
                                    Cada entrada <span className="math-var">a<sub>ij</sub></span> de la matriz representa la intensidad de brillo en esa coordenada. Una imagen de 1 megapíxel es, literalmente, una matriz con un millón de entradas numéricas.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* PASO 2: La Herramienta */}
                    <section>
                        <h2 className="text-2xl font-bold mb-6 serif border-b border-white/5 pb-2 flex items-center gap-3">
                            <Sigma size={20} className="text-accent" />
                            2. La Descomposición Fundamental
                        </h2>
                        <p className="blog-text">
                            La SVD (Singular Value Decomposition) descompone nuestra matriz original <span className="math-var text-accent">A</span> en el producto de tres matrices especiales:
                        </p>
                        <div className="flex flex-col items-center my-10 gap-4">
                            <div className="glass-card px-6 sm:px-10 py-6 text-xl sm:text-2xl md:text-3xl font-mono text-accent border-accent/20 text-center">
                                A = U Σ Vᵀ
                            </div>
                            <p className="text-dim text-sm text-center max-w-md italic">
                                Esta factorización nos permite separar los componentes esenciales de la imagen del ruido o detalles irrelevantes.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                            <div className="p-6 sm:p-8 bg-white/5 rounded-3xl border border-white/10 group hover:border-accent/40 transition-colors">
                                <h3 className="text-accent font-bold sans text-[10px] mb-4 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                    Σ (Sigma)
                                </h3>
                                <p className="text-secondary text-sm leading-relaxed">
                                    Matriz diagonal con los <span className="italic">Valores Singulares</span> ordenados. Representan la "energía" de cada dirección estructural y la relevancia de cada patrón.
                                </p>
                            </div>
                            <div className="p-6 sm:p-8 bg-white/5 rounded-3xl border border-white/10 group hover:border-accent/40 transition-colors">
                                <h3 className="text-accent font-bold sans text-[10px] mb-4 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                    U y V (Vectores)
                                </h3>
                                <p className="text-secondary text-sm leading-relaxed">
                                    Matrices ortogonales con los <span className="italic">Vectores Singulares</span>, que definen los patrones básicos de la imagen a través de su geometría.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* PASO 3: La Estrategia de Compresión */}
                    <section>
                        <h2 className="text-2xl font-bold mb-6 serif border-b border-white/5 pb-2 flex items-center gap-3">
                            <Layers size={20} className="text-accent" />
                            3. SVD Reducida y el parámetro <span className="math-var lowercase">k</span>
                        </h2>
                        <p className="blog-text">
                            Aquí ocurre la magia. En lugar de usar la descomposición completa, realizamos un <strong>truncamiento</strong>. ¿Cómo se obtiene exactamente esta versión reducida?
                        </p>

                        {/* Explicación Intuitiva del Truncamiento */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-10 bg-white/5 rounded-3xl p-6 sm:p-8 border border-white/10">
                            <div className="space-y-4">
                                <h3 className="text-white font-bold sans text-xs uppercase tracking-widest border-l-2 border-accent pl-4">El Proceso de "Poda"</h3>
                                <p className="text-secondary text-sm leading-relaxed">
                                    Obtener la SVD reducida es como <strong>recortar</strong> las matrices para quedarnos solo con lo más importante:
                                </p>
                                <ul className="text-secondary text-sm space-y-4">
                                    <li className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">1</span>
                                        <span>De <span className="math-var">U</span>, solo nos quedamos con las primeras <span className="math-var">k</span> columnas.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">2</span>
                                        <span>De <span className="math-var">Σ</span>, tomamos el bloque superior de <span className="math-var">k × k</span>.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">3</span>
                                        <span>De <span className="math-var">Vᵀ</span>, solo conservamos las primeras <span className="math-var">k</span> filas.</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="flex flex-col items-center justify-center bg-black/20 rounded-2xl p-6 border border-white/5">
                                <div className="flex gap-2 items-end mb-4">
                                    <div className="w-10 h-16 bg-accent border border-accent/50 rounded flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                                        <span className="text-[10px] font-mono font-bold">U<sub>k</sub></span>
                                    </div>
                                    <div className="w-10 h-10 bg-accent/80 border border-accent/50 rounded flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.2)]">
                                        <span className="text-[10px] font-mono font-bold">Σ<sub>k</sub></span>
                                    </div>
                                    <div className="w-16 h-10 bg-accent/60 border border-accent/50 rounded flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.1)]">
                                        <span className="text-[10px] font-mono font-bold">V<sub>k</sub>ᵀ</span>
                                    </div>
                                </div>
                                <div className="text-[11px] text-accent font-bold uppercase tracking-widest text-center">
                                    Aproximación Óptima (Rango k)
                                </div>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8 bg-accent/5 border border-accent/20 rounded-3xl my-8">
                            <h4 className="text-accent font-bold sans text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Lightbulb size={14} /> ¿Por qué k?
                            </h4>
                            <p className="text-secondary text-lg leading-relaxed font-serif m-0">
                                El parámetro <span className="math-var">k</span> es nuestra herramienta de precisión. Al elegir un valor pequeño, descartamos el ruido técnico y nos quedamos con la esencia estructural.
                            </p>
                        </div>
                    </section>

                    {/* PASO 4: ¿Por qué funciona? */}
                    <section>
                        <h2 className="text-2xl font-bold mb-6 serif border-b border-white/5 pb-2 flex items-center gap-3">
                            <Lightbulb size={20} className="text-accent" />
                            4. Intuición Visual
                        </h2>
                        <p className="blog-text">
                            Las imágenes naturales no son aleatorias; tienen mucha estructura correlacionada (cielos, texturas constantes, bordes).
                        </p>
                        <blockquote className="blog-quote serif">
                            "La SVD concentra casi toda la información en los primeros 10 o 20 valores singulares. El resto de la matriz suele contener detalles que el ojo humano apenas nota."
                        </blockquote>
                    </section>

                    {/* PASO 5: Resultado Práctico */}
                    <section className="pb-20">
                        <h2 className="text-2xl font-bold mb-6 serif border-b border-white/5 pb-2 flex items-center gap-3">
                            <Cpu size={20} className="text-accent" />
                            5. Eficiencia en el Mundo Real
                        </h2>
                        <div className="bg-white/5 p-6 sm:p-8 rounded-3xl border border-white/10">
                            <p className="blog-text text-lg mb-6">
                                Al final del día, la compresión es un juego de números. Si una imagen es de <span className="font-mono text-white">1000 × 1000</span> píxeles por canal:
                            </p>
                            <ul className="space-y-6 text-secondary mb-8">
                                <li className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                                    <div>
                                        <strong className="text-white block mb-1">Sin SVD:</strong>
                                        <span className="font-mono">3 × (1000 × 1000) = 3,000,000</span> entradas de datos.
                                    </div>
                                </li>
                                <li className="flex items-start gap-4 p-4 bg-accent/5 rounded-2xl border border-accent/10">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                                    <div>
                                        <strong className="text-accent block mb-1">Con SVD (k=50):</strong>
                                        <span className="font-mono text-accent">3 × (50 × (1000 + 1000 + 1)) = 300,150</span> entradas de datos.
                                    </div>
                                </li>
                            </ul>
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 font-bold text-center">
                                ¡Reducción del 90% del espacio manteniendo la esencia visual!
                            </div>
                        </div>
                    </section>
                </div>
            </motion.article>
        </div>
    );
};
