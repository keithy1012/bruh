import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "./hooks/useUser";
import { MainLayout } from "./layouts/MainLayout";
import { OnboardingPage } from "./pages/OnboardingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GoalChatPage } from "./pages/GoalChatPage";
import { GoalDetailPage } from "./pages/GoalDetailPage";
import { CreditChatPage } from "./pages/CreditChatPage";
import { GoalsPage } from "./components/GoalsPage";
import { LearningPage } from "./components/LearningPage";
import { BudgetPage } from "./components/BudgetPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isOnboarded } = useUser();

  if (!isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/goals"
          element={
            <ProtectedRoute>
              <GoalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/goals/chat"
          element={
            <ProtectedRoute>
              <GoalChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/goals/:goalId"
          element={
            <ProtectedRoute>
              <GoalDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/credit"
          element={
            <ProtectedRoute>
              <CreditChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learning"
          element={
            <ProtectedRoute>
              <LearningPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/budget"
          element={
            <ProtectedRoute>
              <BudgetPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}