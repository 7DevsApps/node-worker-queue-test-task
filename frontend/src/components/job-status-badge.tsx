import type { JobStatus } from '@/types/job'
import { Badge } from '@/components/ui/badge'

const LABELS: Record<JobStatus, string> = {
  queued: 'Queued',
  processing: 'Processing',
  retrying: 'Retrying',
  completed: 'Completed',
  failed: 'Failed',
} as const

const STATUS_MAP = {
  completed: 'success',
  failed: 'destructive',
  retrying: 'warning',
  processing: 'default',
  queued: 'secondary',
} as const

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <Badge variant={STATUS_MAP[status]}>
      {LABELS[status]}
    </Badge>
  )
}
