import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';

export function Header() {
  const { goToLanding } = useApp();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="gradient-farol px-4 py-5 h-[70px] text-primary-foreground shadow-lg flex items-center justify-center"
    >
      <div
        className="flex items-center justify-center gap-3 cursor-pointer"
        onClick={goToLanding}
        role="button"
        aria-label="Voltar para a página inicial"
      >
        <img src="/logo-farollbr.jpeg" alt="Farollbr" className="h-10 w-10 rounded-full object-cover" />
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Farollbr
        </h1>
      </div>
    </motion.header>
  );
}
