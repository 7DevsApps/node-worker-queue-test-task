import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
} from '@tanstack/react-router'

import { JobDetailPage } from '@/pages/job-detail-page'
import { JobsListPage } from '@/pages/jobs-list-page'

const rootRoute = createRootRoute({
  component: function RootLayout() {
    return (
      <div className="min-h-svh bg-background text-foreground">
        <header className="border-b bg-card/40 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
            <Link
              to="/"
              className="text-lg font-semibold tracking-tight text-foreground hover:opacity-90"
            >
              Job console
            </Link>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              API: jobs queue & retries
            </span>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    )
  },
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: JobsListPage,
})

const jobDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/jobs/$jobId',
  component: function JobDetailRouteView() {
    const { jobId } = jobDetailRoute.useParams()
    return <JobDetailPage jobId={jobId} />
  },
})

const routeTree = rootRoute.addChildren([indexRoute, jobDetailRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
