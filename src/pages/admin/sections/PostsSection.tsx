import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Post {
  id: string;
  content: string;
  status: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  profiles?: { username: string; display_name: string | null } | null;
}

export default function PostsSection() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*, profiles!posts_user_id_fkey(username, display_name)")
      .order("created_at", { ascending: false })
      .limit(50);
    setPosts((data as unknown as Post[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const removePost = async (id: string) => {
    if (!confirm("Remove this post?")) return;
    const adminId = (await supabase.auth.getUser()).data.user?.id;
    await supabase.from("posts").update({ status: "removed" }).eq("id", id);
    await supabase.from("activity_logs").insert({ admin_id: adminId, action: "post_removed", target_type: "post", target_id: id });
    await fetchPosts();
  };

  return (
    <div className="gradient-card rounded-2xl border border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 text-xs text-muted-foreground font-medium text-left">User</th>
              <th className="px-4 py-3 text-xs text-muted-foreground font-medium text-left">Content</th>
              <th className="px-4 py-3 text-xs text-muted-foreground font-medium text-left">Engagement</th>
              <th className="px-4 py-3 text-xs text-muted-foreground font-medium text-left">Status</th>
              <th className="px-4 py-3 text-xs text-muted-foreground font-medium text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array(5).fill(0).map((_, i) => (
              <tr key={i} className="border-b border-white/5">
                <td colSpan={5} className="px-4 py-4"><div className="h-4 bg-secondary rounded animate-shimmer" /></td>
              </tr>
            )) : posts.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">No posts yet</td></tr>
            ) : posts.map((post) => (
              <tr key={post.id} className="border-b border-white/5 hover:bg-secondary/20">
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-foreground">
                    {post.profiles?.display_name ?? post.profiles?.username ?? "Unknown"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">@{post.profiles?.username}</p>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <p className="text-xs text-foreground line-clamp-2">{post.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(post.created_at).toLocaleDateString()}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Heart size={11} /> {post.likes_count}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={11} /> {post.comments_count}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    post.status === "active" ? "text-green-400 bg-green-400/10" :
                    post.status === "reported" ? "text-orange-400 bg-orange-400/10" :
                    "text-destructive bg-destructive/10"
                  }`}>{post.status}</span>
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removePost(post.id)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={13} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
