import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Shield, UserX, UserCheck, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  status: string;
  followers_count: number;
  posts_count: number;
  created_at: string;
  role?: string;
}

export default function UsersSection() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [roleDropdown, setRoleDropdown] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const query = supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (search) query.ilike("username", `%${search}%`);

    const { data } = await query;

    if (data) {
      // Fetch roles for each user
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const roleMap: Record<string, string> = {};
      roles?.forEach((r) => { roleMap[r.user_id] = r.role; });

      setUsers(data.map((u) => ({ ...u, role: roleMap[u.id] ?? "user" })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [search]);

  const updateStatus = async (userId: string, status: string) => {
    setActionLoading(userId);
    await supabase.from("profiles").update({ status }).eq("id", userId);
    // Log action
    await supabase.from("activity_logs").insert({
      admin_id: (await supabase.auth.getUser()).data.user?.id,
      action: `user_${status}`,
      target_type: "user",
      target_id: userId,
    });
    await fetchUsers();
    setActionLoading(null);
  };

  const updateRole = async (userId: string, role: string) => {
    setActionLoading(userId);
    // Delete existing role then insert new one
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role: role as "admin" | "moderator" | "user" });
    await supabase.from("activity_logs").insert({
      admin_id: (await supabase.auth.getUser()).data.user?.id,
      action: `role_changed_to_${role}`,
      target_type: "user",
      target_id: userId,
    });
    setRoleDropdown(null);
    await fetchUsers();
    setActionLoading(null);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: "text-green-400 bg-green-400/10",
      suspended: "text-orange-400 bg-orange-400/10",
      banned: "text-destructive bg-destructive/10",
    };
    return `text-xs font-medium px-2 py-0.5 rounded-full ${map[status] ?? "text-muted-foreground bg-secondary"}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-secondary rounded-xl px-4 py-2.5 border border-border">
          <Search size={16} className="text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-sm"
          />
        </div>
      </div>

      <div className="gradient-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left">
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium">User</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium">Status</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium">Role</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium">Posts</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium">Joined</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-4 bg-secondary rounded animate-shimmer" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No users found</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                        {user.avatar_url
                          ? <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          : (user.display_name?.[0] ?? user.username[0]).toUpperCase()
                        }
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-xs">{user.display_name ?? user.username}</p>
                        <p className="text-muted-foreground text-[10px]">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(user.status)}>{user.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button
                        onClick={() => setRoleDropdown(roleDropdown === user.id ? null : user.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-secondary px-2 py-1 rounded-lg"
                      >
                        <Shield size={11} /> {user.role} <ChevronDown size={11} />
                      </button>
                      {roleDropdown === user.id && (
                        <div className="absolute z-10 top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                          {["user", "moderator", "admin"].map((r) => (
                            <button
                              key={r}
                              onClick={() => updateRole(user.id, r)}
                              className="block w-full px-4 py-2 text-xs text-left hover:bg-secondary text-foreground capitalize"
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{user.posts_count}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {user.status !== "active" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateStatus(user.id, "active")}
                          disabled={actionLoading === user.id}
                          className="h-7 px-2 text-green-400 hover:text-green-400 hover:bg-green-400/10 text-xs"
                        >
                          <UserCheck size={13} /> Activate
                        </Button>
                      )}
                      {user.status !== "suspended" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateStatus(user.id, "suspended")}
                          disabled={actionLoading === user.id}
                          className="h-7 px-2 text-orange-400 hover:text-orange-400 hover:bg-orange-400/10 text-xs"
                        >
                          Suspend
                        </Button>
                      )}
                      {user.status !== "banned" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateStatus(user.id, "banned")}
                          disabled={actionLoading === user.id}
                          className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                        >
                          <UserX size={13} /> Ban
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
