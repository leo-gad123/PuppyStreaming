import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Users, Film, Flag, ScrollText, LogOut, Menu, X,
  ChevronRight, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

type AdminSection = "analytics" | "users" | "movies" | "posts" | "reports" | "logs";

const navItems: { id: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "analytics", label: "Analytics", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "movies", label: "Movies", icon: Film },
  { id: "posts", label: "Posts & Comments", icon: Flag },
  { id: "reports", label: "Reports", icon: Flag },
  { id: "logs", label: "Activity Logs", icon: ScrollText },
];

interface AdminLayoutProps {
  children: (section: AdminSection) => React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>("analytics");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 glass-strong border-r border-white/5 flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow-primary">
            <Shield size={18} className="text-primary-foreground" />
          </div>
          <div>
            <p className="font-display font-bold text-foreground text-sm">Puppy Admin</p>
            <p className="text-xs text-muted-foreground">Control Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveSection(id); setSidebarOpen(false); }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left",
                activeSection === id
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Icon size={17} />
              <span>{label}</span>
              {activeSection === id && <ChevronRight size={14} className="ml-auto" />}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{user?.email}</p>
              <p className="text-[10px] text-primary font-medium">Administrator</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-muted-foreground hover:text-destructive transition-colors text-xs w-full"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass-strong border-b border-white/5 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <Menu size={20} />
          </button>
          <h1 className="font-display font-bold text-foreground capitalize">
            {navItems.find(n => n.id === activeSection)?.label}
          </h1>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children(activeSection)}
        </main>
      </div>
    </div>
  );
}
