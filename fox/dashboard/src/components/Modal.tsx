import { useEffect, ReactNode } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}

export default function Modal({ open, onClose, title, children, wide = false }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              ${wide ? 'w-[90vw] max-w-5xl' : 'w-[90vw] max-w-2xl'}
              max-h-[85vh] flex flex-col
              bg-slate-900 border border-white/10 rounded-2xl shadow-2xl`}
          >
            <div className="flex items-center justify-between px-8 py-5 border-b border-white/10 shrink-0">
              <h2 className="text-lg font-black text-white">{title}</h2>
              <button onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-8 py-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
