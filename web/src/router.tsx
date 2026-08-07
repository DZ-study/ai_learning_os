import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
const AuthGuard = lazy(() => import("@/components/auth/AuthGuard"));
const Layout = lazy(() => import("@/components/layout/Layout"));
const HomePage = lazy(() => import("./pages/HomePage"));
const GoalPage = lazy(() => import("./pages/GoalPage"));
const AgentPage = lazy(() => import("./pages/AgentPage"));
const AITutorPage = lazy(() => import("./pages/AITutorPage"));
const KnowledgePage = lazy(() => import("./pages/KnowledgePage"))

const LoginPage = lazy(() => import("./pages/LoginPage"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // 登录页（无需 AuthGuard，无需 Layout）
      {
        path: "login",
        element: <LoginPage />,
      },
      // 需要登录的路由，包裹 Layout（侧边栏 + 头部 + 内容区）
      {
        element: <AuthGuard />,
        children: [
          {
            element: <Layout />,
            children: [
              { index: true, element: <HomePage /> },
              { path: "goals", element: <GoalPage /> },
              { path: "agent", element: <AgentPage /> },
              { path: "ai", element: <AITutorPage /> },
              { path: "knowledge", element: <KnowledgePage /> },
            ],
          },
        ],
      },
    ],
  },
]);
