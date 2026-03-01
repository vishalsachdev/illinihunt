import { useState, useEffect } from 'react'
import { ModerationService, type ReportReason } from '@/lib/services/moderation'
import { showToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, X, Loader2 } from 'lucide-react'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  targetType: 'project' | 'comment'
  targetId: string
  targetName: string
}

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam or misleading' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'broken_link', label: 'Broken link or non-functional' },
  { value: 'other', label: 'Other' },
]

export function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reset form and manage body scroll when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setReason(null)
      setDetails('')
      setSubmitting(false)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!reason || submitting) return

    setSubmitting(true)
    try {
      const { error } = await ModerationService.reportContent(
        targetType,
        targetId,
        reason,
        details.trim() || undefined
      )

      if (error) {
        if (error.message.toLowerCase().includes('already reported') || error.message.toLowerCase().includes('duplicate')) {
          showToast.warning('You have already reported this content')
        } else {
          showToast.error('Failed to submit report', { description: error.message })
        }
        return
      }

      showToast.success('Report submitted', 'Thank you for helping keep the community safe.')
      onClose()
    } catch {
      showToast.error('Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!submitting ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-500/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Report {targetType === 'project' ? 'Project' : 'Comment'}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Reporting <span className="font-medium text-foreground">"{targetName}"</span>
          </p>

          {/* Reason selection */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground mb-2">
              Why are you reporting this?
            </legend>
            {REPORT_REASONS.map(({ value, label }) => (
              <label
                key={value}
                className="flex items-center gap-3 p-3 rounded-md border border-border hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={value}
                  checked={reason === value}
                  onChange={() => setReason(value)}
                  className="accent-red-600"
                  disabled={submitting}
                />
                <span className="text-sm text-foreground">{label}</span>
              </label>
            ))}
          </fieldset>

          {/* Optional details */}
          <div className="space-y-2">
            <label
              htmlFor="report-details"
              className="text-sm font-medium text-foreground"
            >
              Additional details{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea
              id="report-details"
              placeholder="Provide any additional context..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              disabled={submitting}
              className="resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleSubmit}
            disabled={!reason || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
