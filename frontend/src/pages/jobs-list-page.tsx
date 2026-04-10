import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'

import { listJobs } from '@/api/jobs-client'
import { JobStatusBadge } from '@/components/job-status-badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatJobDate } from '@/lib/format-date'
import { queryKeys } from '@/lib/query-keys'
import { cn } from '@/lib/utils'
import { JOB_STATUSES, type Job, type JobStatus } from '@/types/job'

const STATUS_FILTER_ALL = '__all__'

const columnHelper = createColumnHelper<Job>()

function JobsListPage() {
  const [statusFilter, setStatusFilter] = useState<string>(STATUS_FILTER_ALL)

  const statusParam = useMemo((): JobStatus | undefined => {
    if (statusFilter === STATUS_FILTER_ALL) return undefined
    return statusFilter as JobStatus
  }, [statusFilter])

  const jobsQuery = useQuery({
    refetchInterval: 2000,
    queryKey: queryKeys.jobs.list(statusParam),
    queryFn: () => listJobs(statusParam),
  })

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'task',
        header: 'Task',
        cell: ({ row }) => (
          <div className="max-w-[220px] truncate font-medium">
            <Link
              to={`/jobs/${row.original.id}`}
              className="text-primary hover:underline"
            >
              {row.original.task}
            </Link>

            <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
              {row.original.id}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <div className="flex flex-wrap items-center gap-2">
            <JobStatusBadge status={info.getValue()} />
            {info.getValue() === 'retrying' ? (
              <span className="text-xs text-amber-800 dark:text-amber-200">
                Will run again
              </span>
            ) : null}
          </div>
        ),
      }),
      columnHelper.display({
        id: 'attempts',
        header: 'Attempts',
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums">
            <span className="font-medium">
              {row.original.attempts}
            </span>

            <span className="text-muted-foreground">
              {' '}
              / {row.original.max_attempts}
            </span>
          </span>
        ),
      }),
      columnHelper.accessor('created_at', {
        id: 'created_at',
        header: 'Created',
        cell: (info) => (
          <span className="text-muted-foreground">
            {formatJobDate(info.getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="sr-only">Open</span>,
        cell: ({ row }) => (
          <Link
            to={`/jobs/${row.original.id}`}
            className="inline-flex text-muted-foreground hover:text-foreground"
            aria-label={`Open job ${row.original.task}`}
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        ),
      }),
    ],
    [],
  )

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unstable function refs by design
  const table = useReactTable({
    columns,
    data: jobsQuery.data ?? [],
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 text-left">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Jobs</h1>
          <p className="mt-1 text-muted-foreground">
            Async work tracked in Postgres; workers retry with exponential
            backoff until completion or max attempts.
          </p>
        </div>
        <div className="w-full sm:w-56">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Filter by status
          </label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger aria-label="Filter jobs by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_FILTER_ALL}>All statuses</SelectItem>
              {JOB_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Queue</CardTitle>
          <CardDescription>
            Newest first. Select a row to open the live timeline for that job.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobsQuery.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : jobsQuery.isError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
              <p className="font-medium text-destructive">Could not load jobs</p>
              <p className="mt-1 text-muted-foreground">
                {jobsQuery.error instanceof Error
                  ? jobsQuery.error.message
                  : 'Unknown error'}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => jobsQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : jobsQuery.data?.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No jobs match this filter.
            </p>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className={cn(
                          header.column.id === 'created_at' &&
                          'hidden md:table-cell',
                          header.column.id === 'actions' && 'w-10',
                          header.column.id === 'attempts' &&
                          'whitespace-nowrap',
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="cursor-pointer">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          cell.column.id === 'created_at' &&
                          'hidden md:table-cell',
                          cell.column.id === 'actions' && 'text-right',
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export { JobsListPage }
