const RANK_STYLES = [
  'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-yellow-500/30',
  'bg-gradient-to-br from-slate-300 to-slate-500 shadow-slate-400/30',
  'bg-gradient-to-br from-amber-600 to-amber-800 shadow-amber-600/30',
] as const

interface RankBadgeProps {
  /** 0-based index (0 = gold, 1 = silver, 2 = bronze) */
  index: number
}

export function RankBadge({ index }: RankBadgeProps) {
  return (
    <div className="absolute top-4 left-4 z-10">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ${
          RANK_STYLES[index] ?? 'bg-white/10 border border-white/20'
        }`}
      >
        {index + 1}
      </div>
    </div>
  )
}
