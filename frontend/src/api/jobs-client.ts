import { axiosClient } from '@/api/axios-client'
import type { Job, JobStatus } from '@/types/job'

export async function listJobs(status?: JobStatus) {
  const { data } = await axiosClient.request<Job[]>({
    url: '/jobs',
    params: status ? { status } : undefined,
  })

  return data
}

export async function getJob(id: string) {
  const { data } = await axiosClient.request<Job>({
    url: `/jobs/${id}`,
  })

  return data
}
