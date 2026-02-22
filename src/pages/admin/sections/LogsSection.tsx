import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollText } from "lucide-react";

interface Log {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
  admin_id: string;
  admin?: { username: string } | null;
}

const actionColor = (action: string) => {
  if (action.includes("ban") || action.includes("removed")) return "text-destructive bg-destructive/10";
  if (action.includes("suspend")) return "text-orange-400 bg-orange-400/10";
  if (action.includes("activ")) return "text-green-400 bg-green-400/10";
  if (action.includes("admin") || action.includes("role")) return "text-primary bg-primary/10";
  return "text-muted-foreground bg-secondary";
};

export default function LogsSection() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("activity_logs")
      .select("*, admin:profiles!activity_logs_admin_id_fkey(username)")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setLogs((data as any[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="gradient-card rounded-2xl border border-white/5 overflow-hidden">
      {loading ? (
        <div className="p-6 space-y-3">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-12 bg-secondary rounded-xl animate-shimmer" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="p-8 text-center">
          <ScrollText size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No activity yet</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {logs.map((log) => (
            <div key={log.id} className="px-4 py-3 flex items-center gap-3 hover:bg-secondary/20 transition-colors">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${actionColor(log.action)}`}>
                {log.action.replace(/_/g, " ")}
              </span>
              <div className="flex-1 min-w-0">
                {log.target_type && (
                  <p className="text-xs text-muted-foreground truncate">
                    {log.target_type}: <span className="text-foreground font-mono text-[10px]">{log.target_id?.slice(0, 8)}...</span>
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  by @{(log.admin as any)?.username ?? "admin"}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
