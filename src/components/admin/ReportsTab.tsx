import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ModerationService, type Report, type ReportStatus, type ReportReason } from '@/lib/services/moderation'
import { showToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  MessageSquare,
  ExternalLink,
} from 'lucide-react'

type ReportFilter = 'all' | 'pending' | 'resolved' | 'dismissed'

const REASON_STYLES: Record<ReportReason, { className: string; label: string }> = {
  spam: { className: 'bg-red-100 text-red-800 border-red-200', label: 'Spam' },
  inappropriate: { className: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Inappropriate' },
  broken_link: { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Broken Link' },
  other: { className: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Other' },
}

const STATUS_STYLES: Record<ReportStatus, { className: string; label: string }> = {
  pending: { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
  resolved: { className: 'bg-green-100 text-green-800 border-green-200', label: 'Resolved' },
  dismissed: { className: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Dismissed' },
}

export function ReportsTab() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<ReportFilter>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadReports = useCallback(async () => {
    setLoading(true)

    const filterStatus = activeFilter === 'all' ? undefined : activeFilter as ReportStatus
    const { data, error } = await ModerationService.getReports(filterStatus)

    if (error) {
      showToast.error('Failed to load reports', { description: error.message })
    }

    setReports(data || [])
    setLoading(false)
  }, [activeFilter])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const handleResolve = async (reportId: string, resolution: 'resolved' | 'dismissed') => {
    setActionLoading(reportId)

    const { error } = await ModerationService.resolveReport(reportId, resolution)

    if (error) {
      showToast.error(`Failed to ${resolution === 'resolved' ? 'resolve' : 'dismiss'} report`, {
        description: error.message,
      })
    } else {
      // Remove from list if filtering pending, otherwise update status
      if (activeFilter === 'pending') {
        setReports(prev => prev.filter(r => r.id !== reportId))
      } else {
        setReports(prev =>
          prev.map(r =>
            r.id === reportId
              ? { ...r, status: resolution, resolved_at: new Date().toISOString() }
              : r
          )
        )
      }
      showToast.success(
        resolution === 'resolved' ? 'Report resolved' : 'Report dismissed'
      )
    }

    setActionLoading(null)
  }

  const getTargetLink = (report: Report): string | null => {
    if (!report.target) return null
    if (report.target_type === 'project') {
      return `/project/${report.target_id}`
    }
    if (report.target_type === 'comment' && report.target.project_id) {
      return `/project/${report.target.project_id}`
    }
    return null
  }

  const getTargetPreview = (report: Report): string => {
    if (!report.target) return 'Deleted content'
    if (report.target_type === 'project') {
      return report.target.name || 'Unknown project'
    }
    if (report.target_type === 'comment') {
      const content = report.target.content || ''
      return content.length > 100 ? content.slice(0, 100) + '...' : content || 'Empty comment'
    }
    return 'Unknown'
  }

  return (
    <div>
      {/* Sub-filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'resolved', 'dismissed'] as ReportFilter[]).map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(filter)}
            className={activeFilter === filter ? 'bg-uiuc-orange hover:bg-uiuc-orange/90' : ''}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Button>
        ))}
      </div>

      {/* Reports List */}
      {loading ? (
        <LoadingSpinner message="Loading reports..." />
      ) : reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => {
            const targetLink = getTargetLink(report)
            const reasonStyle = REASON_STYLES[report.reason]
            const statusStyle = STATUS_STYLES[report.status]

            return (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Report Info */}
                    <div className="flex-1 min-w-0">
                      {/* Target preview */}
                      <div className="flex items-center gap-2 mb-2">
                        {report.target_type === 'project' ? (
                          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        {targetLink ? (
                          <Link
                            to={targetLink}
                            className="text-base font-semibold text-foreground hover:text-uiuc-orange transition-colors truncate"
                          >
                            {getTargetPreview(report)}
                          </Link>
                        ) : (
                          <span className="text-base font-semibold text-muted-foreground truncate">
                            {getTargetPreview(report)}
                          </span>
                        )}
                        <Badge className={reasonStyle.className}>{reasonStyle.label}</Badge>
                        <Badge className={statusStyle.className}>{statusStyle.label}</Badge>
                      </div>

                      {/* Details */}
                      {report.details && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {report.details}
                        </p>
                      )}

                      {/* Meta row */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {report.reporter.full_name || report.reporter.username || 'Unknown'}
                          <span className="text-muted-foreground/60 ml-1">
                            ({report.reporter.email})
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {report.status === 'pending' && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleResolve(report.id, 'resolved')}
                          disabled={actionLoading === report.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolve(report.id, 'dismissed')}
                          disabled={actionLoading === report.id}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/10 rounded-lg border-2 border-dashed border-border/50">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No reports found
          </h3>
          <p className="text-muted-foreground">
            {activeFilter === 'all'
              ? 'No reports have been submitted yet'
              : `No ${activeFilter} reports to display`}
          </p>
        </div>
      )}
    </div>
  )
}
