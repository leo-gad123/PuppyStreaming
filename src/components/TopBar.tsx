import { Bell, Search } from "lucide-react";

interface TopBarProps {
  page: string;
}

const pageTitles: Record<string, string> = {
  feed: "Puppy",
  movies: "Discover",
  messages: "Messages",
  party: "Watch Party",
  profile: "Profile",
};

export default function TopBar({ page }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-white/5 px-4 py-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div>
          {page === "feed" ? (
            <h1 className="font-display font-bold text-xl gradient-text">Puppy</h1>
          ) : (
            <h1 className="font-display font-bold text-xl text-foreground">{pageTitles[page]}</h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Search size={18} />
          </button>
          <button className="relative w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border border-background" />
          </button>
        </div>
      </div>
    </header>
  );
}
