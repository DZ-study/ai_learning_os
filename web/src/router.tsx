import { lazy } from 'react';
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import HomePage from "./pages/HomePage";
import GoalPage from "./pages/GoalPage";
import KnowledgePage from "./pages/KnowledgePage";
import AITutorPage from "./pages/AITutorPage";
import QuizPage from "./pages/QuizPage";

const LoginPage = lazy(() => import("./pages/LoginPage"))

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "goals", element: <GoalPage /> },
      { path: "knowledge", element: <KnowledgePage /> },
      { path: "ai", element: <AITutorPage /> },
      { path: "quiz", element: <QuizPage /> },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />
  }
]);
