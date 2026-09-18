import { lazy } from "react"
import { createBrowserRouter } from "react-router-dom"
import App from "./App"
import GoalAgentTutor from './pages/goal/GoalAgentTutor'
const GoalSpace = lazy(() => import('@/pages/GoalSpace'))
const AuthGuard = lazy(() => import("@/components/auth/AuthGuard"))
const Layout = lazy(() => import("@/components/layout/Layout"))
const HomePage = lazy(() => import("./pages/HomePage"))
const GoalPage = lazy(() => import("./pages/goal/GoalPage"))
const AgentPage = lazy(() => import("./pages/AgentPage"))
const AITutorPage = lazy(() => import("./pages/AITutorPage"))
const KnowledgePage = lazy(() => import("./pages/KnowledgePage"))
const StudyPage = lazy(() => import("./pages/StudyPage"))

const LoginPage = lazy(() => import("./pages/LoginPage"))

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // Login page (no AuthGuard or Layout).
      {
        path: "login",
        element: <LoginPage />,
      },
      // Authenticated routes wrapped by Layout.
      {
        element: <AuthGuard />,
        children: [
          {
            // element: <Layout />,
            children: [
              { index: true, element: <HomePage /> },
              { path: "study_goal", element: <GoalPage /> },
              { path: "goals/:goalId/agent", element: <GoalAgentTutor /> },
              { path: "agent", element: <AgentPage /> },
              { path: "ai", element: <AITutorPage /> },
              { path: "knowledge", element: <KnowledgePage /> },
              { path: "space/:goalId/detail", element: <GoalSpace /> },
              { path: "space/:goalId", element: <GoalSpace /> },
              { path: "study", element: <StudyPage /> }
            ],
          },
        ],
      },
    ],
  },
])
