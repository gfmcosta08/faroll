import { LucideIcon } from 'lucide-react'

type ColorKey = 'orange' | 'blue' | 'emerald' | 'red' | 'purple' | 'slate'

interface StatCardProps {
  title: string
  value: string | number
  sub?: string
  icon?: LucideIcon
  color?: ColorKey
  onClick?: () => void
  large?: boolean
}

const colors: Record<ColorKey, { bg: string; text: string; border: string }> = {
  orange:  { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/20' },
  blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  red:     { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20' },
  purple:  { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/20' },
  slate:   { bg: 'bg-slate-500/10',   text: 'text-slate-400',   border: 'border-slate-500/20' },
}

export default function StatCard({ title, value, sub, icon: Icon, color = 'orange', onClick, large }: StatCardProps) {
  const c = colors[color]
  return (
    <div
      onClick={onClick}
      className={`bg-slate-900/50 border border-white/10 rounded-2xl p-6 flex flex-col gap-3
        ${onClick ? 'cursor-pointer hover:border-orange-500/30 hover:scale-[1.02] active:scale-[0.99] transition-all' : ''}`}
    >
      {Icon && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} ${c.border} border`}>
          <Icon size={20} className={c.text} />
        </div>
      )}
      <div>
        <div className={`${large ? 'text-3xl' : 'text-2xl'} font-black text-white leading-none`}>{value}</div>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">{title}</div>
        {sub && <div className="text-xs text-slate-600 mt-1">{sub}</div>}
      </div>
    </div>
  )
}
