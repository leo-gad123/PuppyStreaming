import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StoryBar from "@/components/StoryBar";
import CreatePost from "@/components/CreatePost";

interface Post {
  id: string;
  content: string;
  movie_ref: string | null;
  image_url: string | null;
  is_video: boolean;
  likes_count: number;
  comments_count: number;
  tags: string[] | null;
  created_at: string;
  user_id: string;
  profiles?: { username: string; display_name: string | null; avatar_url: string | null } | null;
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = () => {
    supabase
      .from("posts")
      .select("*, profiles!posts_user_id_fkey(username, display_name, avatar_url)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setPosts((data as unknown as Post[]) ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchPosts(); }, []);

  return (
    <div className="animate-fade-in">
      <div className="border-b border-border/50">
        <StoryBar />
      </div>

      <div className="flex flex-col gap-4 p-4 pb-28">
        <CreatePost onCreated={fetchPosts} />

        <div className="flex items-center justify-between px-1">
          <h2 className="font-display font-bold text-foreground">For You</h2>
          <button className="text-xs text-primary font-semibold">Following</button>
        </div>

        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="gradient-card rounded-2xl border border-white/5 p-4 h-40 animate-shimmer" />
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <p>No posts yet. Be the first to post! 🎬</p>
          </div>
        ) : posts.map((post) => (
          <div key={post.id} className="gradient-card rounded-2xl border border-white/5 overflow-hidden">
            {post.image_url && (
              <img src={post.image_url} alt="" className="w-full h-52 object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                  {post.profiles?.avatar_url
                    ? <img src={post.profiles.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    : (post.profiles?.display_name?.[0] ?? post.profiles?.username?.[0] ?? "?").toUpperCase()
                  }
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{post.profiles?.display_name ?? post.profiles?.username ?? "User"}</p>
                  <p className="text-xs text-muted-foreground">@{post.profiles?.username} · {timeAgo(post.created_at)}</p>
                </div>
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-3">{post.content}</p>
              {post.movie_ref && (
                <div className="text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-xl inline-block mb-3">🎬 {post.movie_ref}</div>
              )}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-xs text-accent">#{tag}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4 text-muted-foreground text-xs">
                <button className="flex items-center gap-1 hover:text-primary transition-colors">❤️ {post.likes_count.toLocaleString()}</button>
                <button className="flex items-center gap-1 hover:text-accent transition-colors">💬 {post.comments_count}</button>
                <button className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto">↗ Share</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
