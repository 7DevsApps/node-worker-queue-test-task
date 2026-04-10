import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { useMemo } from 'react'

import { getJob } from '@/api/jobs-client'
import { JobStatusBadge } from '@/components/job-status-badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useJobTimeline } from '@/hooks/use-job-timeline'
import { formatJobDate, formatRelative } from '@/lib/format-date'
import { queryKeys } from '@/lib/query-keys'
import { cn } from '@/lib/utils'
import type { Job } from '@/types/job'

function isTerminalStatus(job: Job) {
  return isCompletedStatus(job) || isFailedStatus(job)
}

function isCompletedStatus(job: Job) {
  return job.status === 'completed'
}

function isFailedStatus(job: Job) {
  return job.status === 'failed'
}

export function JobDetailPage({ jobId }: { jobId: string }) {
  const jobQuery = useQuery({
    queryKey: queryKeys.job.detail(jobId),
    queryFn: () => getJob(jobId),
    refetchInterval: (query) => {
      const job = query.state.data

      if (!job) {
        return 2000
      }

      if (isTerminalStatus(job)) {
        return false
      }

      return 2000
    },
  })

  const job = jobQuery.data
  const timeline = useJobTimeline(job)

  const retryEvents = useMemo(
    () => timeline.filter(item => item.kind === 'state' && item.status === 'retrying'),
    [timeline],
  )

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 text-left">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 gap-1" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            All jobs
          </Link>
        </Button>
      </div>

      {jobQuery.isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : jobQuery.isError ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">Job unavailable</CardTitle>
            <CardDescription>
              {jobQuery.error instanceof Error
                ? jobQuery.error.message
                : 'Unknown error'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" onClick={() => jobQuery.refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : job ? (
        <>
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <JobStatusBadge status={job.status} />

              {!isTerminalStatus(job) ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Live updates (2s)
                </span>
              ) : null}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">{job.task}</h1>
            <p className="font-mono text-sm text-muted-foreground">{job.id}</p>
          </header>

          <Card className="border-amber-500/30 bg-amber-500/[0.06] dark:bg-amber-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Attempts & retries</CardTitle>
              <CardDescription>
                Workers record each run. The first failure moves the job to
                retrying (not failed) until max attempts are exhausted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-semibold tabular-nums">
                  {job.attempts}
                </span>
                <span className="text-muted-foreground">
                  of {job.max_attempts} attempts used
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(100, (job.attempts / job.max_attempts) * 100)}%`,
                  }}
                />
              </div>

              {job.status === 'retrying' && job.next_run_at ? (
                <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-background/80 p-3 text-sm">
                  <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
                  <div>
                    <p className="font-medium text-amber-950 dark:text-amber-50">
                      Retry scheduled
                    </p>

                    <p className="mt-1 text-muted-foreground">
                      Next run at{' '}

                      <span className="font-medium text-foreground">
                        {formatJobDate(job.next_run_at)}
                      </span>

                      {' '}

                      ({formatRelative(job.next_run_at)}). Backoff follows{' '}

                      <code className="rounded bg-muted px-1 py-0.5 text-xs">
                        1000 × 3^attempt + jitter(±500ms)
                      </code>
                      .
                    </p>
                  </div>
                </div>
              ) : null}
              {retryEvents.length > 0 ? (
                <div>
                  <p className="mb-2 text-sm font-medium">
                    Retry phases observed on this page
                  </p>

                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {retryEvents.map((e) => (
                      <li key={e.id} className="flex gap-2">
                        <span className="tabular-nums text-foreground">
                          {e.at ? formatJobDate(e.at) : '—'}
                        </span>
                        <span>
                          Attempt {e.attempts ?? '—'} — waiting for backoff
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {job.status === 'failed' && job.error ? (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">Final error</p>
                    <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-foreground">
                      {job.error}
                    </pre>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status timeline</CardTitle>
              <CardDescription>
                Distinct states observed while this tab is open. The API exposes
                current row state only; history fills in as the job changes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-0 border-l border-border pl-6">
                {timeline.map((entry) => (
                  <li key={entry.id} className="relative pb-8 last:pb-0">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div
                            className={cn(
                              'h-3 w-3 rounded-full border-2 border-background',
                              COLOR_MAP[entry.status] || 'bg-primary',
                            )}
                          />

                          <span className="font-medium">
                            {entry.kind === 'created' ? 'Job created' : 'State update'}
                          </span>
                        </div>

                        {entry.status && (
                          <JobStatusBadge status={entry.status} />
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {formatJobDate(entry.at)} · {formatRelative(entry.at)}
                      </p>
                      {entry.kind === 'state' ? (
                        <div className="mt-2 space-y-1 text-sm">
                          <p>
                            <span className="text-muted-foreground">
                              Attempts recorded:
                            </span>{' '}
                            <span className="font-mono tabular-nums">
                              {entry.attempts ?? '—'}
                            </span>
                          </p>
                          {entry.status === 'retrying' && entry.next_run_at ? (
                            <p className="text-amber-900 dark:text-amber-100">
                              Next attempt after{' '}
                              {formatJobDate(entry.next_run_at)}
                            </p>
                          ) : null}
                          {entry.error ? (
                            <pre className="max-h-32 overflow-auto rounded-md bg-muted p-2 font-mono text-xs">
                              {entry.error}
                            </pre>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payload</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-4 font-mono text-xs">
                {JSON.stringify(job.payload, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expected lifecycle</CardTitle>
              <CardDescription>
                From the job processor design: happy path vs retry path.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Success:</span>{' '}
                queued → processing → completed
              </p>
              <p>
                <span className="font-medium text-foreground">With failures:</span>{' '}
                queued → processing → retrying → (processing again) → completed
                or failed after max attempts.
              </p>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}

const COLOR_MAP = {
  completed: 'bg-emerald-500',
  failed: 'bg-destructive',
  retrying: 'bg-amber-500',
  processing: 'bg-primary',
  queued: 'bg-muted-foreground',
} as const
