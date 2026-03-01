import { type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionHref?: string
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, actionHref }: EmptyStateProps) {
  return (
    <div className="text-center py-12 bg-muted/10 rounded-lg border-2 border-dashed border-border/50">
      <Icon className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-md mx-auto">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
      {actionLabel && actionHref && !onAction && (
        <a href={actionHref}>
          <Button>{actionLabel}</Button>
        </a>
      )}
    </div>
  )
}
