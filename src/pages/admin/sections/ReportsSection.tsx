import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCheck, X, AlertTriangle } from "lucide-react";

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_post_id: string | null;
  reporter?: { username: string } | null;
  reported_user?: { username: string } | null;
}

export default function ReportsSection() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reports")
      .select(`
        *,
        reporter:profiles!reports_reporter_id_fkey(username),
        reported_user:profiles!reports_reported_user_id_fkey(username)
      `)
      .eq("status", filter)
      .order("created_at", { ascending: false })
      .limit(50);
    setReports((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, [filter]);

  const takeAction = async (id: string, status: string, action?: string) => {
    const adminId = (await supabase.auth.getUser()).data.user?.id;
    await supabase.from("reports").update({
      status,
      action_taken: action ?? status,
      reviewed_by: adminId,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    await supabase.from("activity_logs").insert({
      admin_id: adminId,
      action: `report_${status}`,
      target_type: "report",
      target_id: id,
    });
    await fetchReports();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["pending", "reviewed", "resolved", "dismissed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
              filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {loading ? Array(3).fill(0).map((_, i) => (
          <div key={i} className="gradient-card rounded-2xl border border-white/5 p-4 h-24 animate-shimmer" />
        )) : reports.length === 0 ? (
          <div className="gradient-card rounded-2xl border border-white/5 p-8 text-center text-muted-foreground text-sm">
            No {filter} reports
          </div>
        ) : reports.map((report) => (
          <div key={report.id} className="gradient-card rounded-2xl border border-white/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} className="text-orange-400" />
                  <span className="text-xs font-semibold text-foreground">{report.reason}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
                {report.details && <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{report.details}</p>}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>Reporter: <span className="text-foreground">@{(report.reporter as any)?.username ?? "unknown"}</span></span>
                  {report.reported_user_id && (
                    <span>Reported: <span className="text-foreground">@{(report.reported_user as any)?.username ?? "unknown"}</span></span>
                  )}
                  {report.reported_post_id && <span>Type: <span className="text-foreground">Post</span></span>}
                </div>
              </div>
              {filter === "pending" && (
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => takeAction(report.id, "resolved", "warned")}
                    className="h-7 px-2 text-green-400 hover:text-green-400 hover:bg-green-400/10 text-xs"
                  >
                    <CheckCheck size={13} /> Resolve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => takeAction(report.id, "dismissed")}
                    className="h-7 px-2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    <X size={13} /> Dismiss
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
