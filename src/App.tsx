import { motion } from 'framer-motion';
import { SVDExplainer } from './components/SVDExplainer';
import { ImageProcessor } from './components/ImageProcessor';

function App() {
  return (
    <div className="min-h-screen pb-20 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[40vw] h-[40vw] rounded-full bg-accent/5 blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] -right-[5%] w-[30vw] h-[30vw] rounded-full bg-accent-secondary/5 blur-[100px]"
        />
      </div>



      <main className="relative z-10">
        {/* Intro Section */}
        <SVDExplainer />

        {/* Processor Section */}
        <ImageProcessor />
      </main>

      <footer className="container mt-20 text-center text-sm text-secondary border-t border-white/5 pt-8 relative z-10">
        <p>© 2026. Creado por <a href="https://github.com/norberto89" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Norberto A. Hernández-Leandro</a>. Implementado con React + TypeScript.</p>
        <p className="mt-2 text-xs opacity-50">Hecho con fines educativos sobre álgebra lineal.</p>
      </footer>
    </div>
  );
}

export default App;
