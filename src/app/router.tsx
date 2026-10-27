import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { RouteError } from './RouteError'

// Each page is its own chunk; Recharts and Socket.IO load only after sign-in.
export const routes: RouteObject[] = [
  {
    errorElement: <RouteError />,
    children: [
      {
        path: '/login',
        lazy: async () => ({ Component: (await import('@/features/auth/components/LoginPage')).default }),
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <Navigate to="/overview" replace /> },
              {
                path: '/overview',
                lazy: async () => ({
                  Component: (await import('@/features/dashboard/components/DashboardPage')).default,
                }),
              },
              {
                path: '/entries',
                lazy: async () => ({
                  Component: (await import('@/features/crowd-entries/components/CrowdEntriesPage')).default,
                }),
              },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/overview" replace /> },
    ],
  },
]

export const createAppRouter = () => createBrowserRouter(routes)
