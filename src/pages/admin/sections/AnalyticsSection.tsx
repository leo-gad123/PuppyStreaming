import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Film, FileText, Flag, MessageCircle, Activity, TrendingUp, UserCheck } from "lucide-react";

interface Analytics {
  total_users: number;
  active_users: number;
  suspended_users: number;
  banned_users: number;
  total_movies: number;
  total_posts: number;
  total_watch_parties: number;
  pending_reports: number;
  total_messages: number;
}

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) => (
  <div className="gradient-card rounded-2xl border border-white/5 p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={20} className="text-primary-foreground" />
    </div>
    <div>
      <p className="text-2xl font-display font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  </div>
);

export default function AnalyticsSection() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.rpc("get_admin_analytics").then(({ data, error }) => {
      if (error) setError(error.message);
      else setAnalytics(data as unknown as Analytics);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array(8).fill(0).map((_, i) => (
        <div key={i} className="gradient-card rounded-2xl border border-white/5 p-5 h-24 animate-shimmer" />
      ))}
    </div>
  );

  if (error) return (
    <div className="text-destructive bg-destructive/10 rounded-xl p-4 text-sm">{error}</div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={analytics?.total_users ?? 0} color="gradient-primary" />
        <StatCard icon={UserCheck} label="Active Users" value={analytics?.active_users ?? 0} color="bg-green-500/80" />
        <StatCard icon={Film} label="Movies" value={analytics?.total_movies ?? 0} color="bg-accent/80" />
        <StatCard icon={FileText} label="Total Posts" value={analytics?.total_posts ?? 0} color="bg-blue-500/80" />
        <StatCard icon={MessageCircle} label="Messages" value={analytics?.total_messages ?? 0} color="bg-purple-500/80" />
        <StatCard icon={Activity} label="Watch Parties" value={analytics?.total_watch_parties ?? 0} color="bg-yellow-500/80" />
        <StatCard icon={Flag} label="Pending Reports" value={analytics?.pending_reports ?? 0} color="bg-destructive/80" />
        <StatCard icon={TrendingUp} label="Suspended" value={analytics?.suspended_users ?? 0} color="bg-orange-500/80" />
      </div>

      {/* User breakdown chart */}
      <div className="gradient-card rounded-2xl border border-white/5 p-5">
        <h3 className="font-display font-bold text-foreground mb-4">User Status Breakdown</h3>
        <div className="space-y-3">
          {[
            { label: "Active", value: analytics?.active_users ?? 0, total: analytics?.total_users ?? 1, color: "bg-green-500" },
            { label: "Suspended", value: analytics?.suspended_users ?? 0, total: analytics?.total_users ?? 1, color: "bg-orange-500" },
            { label: "Banned", value: analytics?.banned_users ?? 0, total: analytics?.total_users ?? 1, color: "bg-destructive" },
          ].map(({ label, value, total, color }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground font-semibold">{value}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full transition-all duration-700`}
                  style={{ width: `${total > 0 ? (value / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
