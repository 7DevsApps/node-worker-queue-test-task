import type { JobStatus } from '@/types/job'

export const queryKeys = {
  jobs: {
    all: ['jobs'] as const,
    list: (status?: JobStatus) => ['jobs', 'list', status ?? 'all'] as const,
  },
  job: {
    detail: (id: string) => ['jobs', 'detail', id] as const,
  },
} as const
