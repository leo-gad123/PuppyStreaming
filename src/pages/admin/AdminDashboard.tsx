import AdminLayout from "./AdminLayout";
import AnalyticsSection from "./sections/AnalyticsSection";
import UsersSection from "./sections/UsersSection";
import MoviesSection from "./sections/MoviesSection";
import PostsSection from "./sections/PostsSection";
import ReportsSection from "./sections/ReportsSection";
import LogsSection from "./sections/LogsSection";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      {(section) => {
        switch (section) {
          case "analytics": return <AnalyticsSection />;
          case "users": return <UsersSection />;
          case "movies": return <MoviesSection />;
          case "posts": return <PostsSection />;
          case "reports": return <ReportsSection />;
          case "logs": return <LogsSection />;
          default: return <AnalyticsSection />;
        }
      }}
    </AdminLayout>
  );
}
