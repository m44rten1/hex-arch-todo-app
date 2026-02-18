import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { PublicLayout } from "@/layouts/PublicLayout";
import { ProtectedLayout } from "@/layouts/ProtectedLayout";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { InboxPage } from "@/pages/InboxPage";
import { TodayPage } from "@/pages/TodayPage";
import { UpcomingPage } from "@/pages/UpcomingPage";
import { ProjectListPage } from "@/pages/ProjectListPage";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage";
import { TagListPage } from "@/pages/TagListPage";
import { TagTasksPage } from "@/pages/TagTasksPage";
import { SearchPage } from "@/pages/SearchPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route element={<ProtectedLayout />}>
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/today" element={<TodayPage />} />
            <Route path="/upcoming" element={<UpcomingPage />} />
            <Route path="/projects" element={<ProjectListPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="/tags" element={<TagListPage />} />
            <Route path="/tags/:tagId" element={<TagTasksPage />} />
            <Route path="/search" element={<SearchPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/inbox" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
