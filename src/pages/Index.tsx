import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import FeedPage from "@/pages/Feed";
import MoviesPage from "@/pages/Movies";
import MessagesPage from "@/pages/Messages";
import WatchPartyPage from "@/pages/WatchParty";
import ProfilePage from "@/pages/Profile";

type Page = "feed" | "movies" | "messages" | "party" | "profile";

const Index = () => {
  const [activePage, setActivePage] = useState<Page>("feed");

  const renderPage = () => {
    switch (activePage) {
      case "feed": return <FeedPage />;
      case "movies": return <MoviesPage />;
      case "messages": return <MessagesPage />;
      case "party": return <WatchPartyPage />;
      case "profile": return <ProfilePage />;
      default: return <FeedPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <TopBar page={activePage} />
      <main className="overflow-y-auto">
        {renderPage()}
      </main>
      <BottomNav active={activePage} onNavigate={(page) => setActivePage(page as Page)} />
    </div>
  );
};

export default Index;
