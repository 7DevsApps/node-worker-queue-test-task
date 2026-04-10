import { useLayoutEffect, useRef, useState } from 'react'
import type { Job, JobStatus } from '@/types/job'

export type TimelineEntryKind = 'created' | 'state'

export interface TimelineEntry {
  id: string
  kind: TimelineEntryKind
  at: string
  status?: JobStatus
  attempts?: number
  error?: string | null
  next_run_at?: string | null
}

function fingerprint(job: Job): string {
  return [
    job.updated_at,
    job.status,
    job.attempts,
    job.error ?? '',
    job.next_run_at ?? '',
  ].join('|')
}

let seq = 0
function nextId(): string {
  seq += 1
  return `${Date.now()}-${seq}`
}

/**
 * Builds a live timeline: a fixed "created" milestone plus each distinct
 * server-reported state observed while polling (fingerprinted per job snapshot).
 */
export function useJobTimeline(job: Job | undefined) {
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const lastJobIdRef = useRef<string | null>(null)
  const lastStableKeyRef = useRef<string | null>(null)

  useLayoutEffect(() => {
    if (!job) {
      lastJobIdRef.current = null
      lastStableKeyRef.current = null
      setEntries([])
      return
    }

    const stableKey = `${job.id}|${fingerprint(job)}`

    if (lastJobIdRef.current !== job.id) {
      lastJobIdRef.current = job.id
      lastStableKeyRef.current = stableKey
      setEntries([
        {
          id: nextId(),
          kind: 'created',
          at: job.created_at,
        },
        {
          id: nextId(),
          kind: 'state',
          at: job.updated_at,
          status: job.status,
          attempts: job.attempts,
          error: job.error,
          next_run_at: job.next_run_at,
        },
      ])
      return
    }

    if (lastStableKeyRef.current === stableKey) {
      return
    }

    lastStableKeyRef.current = stableKey
    setEntries((prev) => [
      ...prev,
      {
        id: nextId(),
        kind: 'state',
        at: job.updated_at,
        status: job.status,
        attempts: job.attempts,
        error: job.error,
        next_run_at: job.next_run_at,
      },
    ])
  }, [job])

  return entries
}
