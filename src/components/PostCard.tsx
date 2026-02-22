import { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface Post {
  id: number;
  user: { name: string; username: string; avatar: string };
  content?: string;
  image?: string;
  isVideo?: boolean;
  movieRef?: string;
  likes: number;
  comments: number;
  time: string;
  tags?: string[];
}

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <article className="gradient-card rounded-2xl overflow-hidden border border-white/5 shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-0.5 rounded-full story-ring">
            <div className="p-0.5 bg-card rounded-full">
              <img src={post.user.avatar} alt={post.user.name} className="w-9 h-9 rounded-full object-cover" />
            </div>
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{post.user.name}</p>
            <p className="text-xs text-muted-foreground">@{post.user.username} · {post.time}</p>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-foreground p-1">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Movie Reference Badge */}
      {post.movieRef && (
        <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
          <Play size={12} className="fill-primary text-primary flex-shrink-0" />
          <span className="text-xs text-primary font-medium truncate">Watching: {post.movieRef}</span>
        </div>
      )}

      {/* Content */}
      {post.content && (
        <p className="px-4 pb-3 text-sm text-foreground leading-relaxed">{post.content}</p>
      )}

      {/* Tags */}
      {post.tags && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {post.tags.map(tag => (
            <span key={tag} className="text-xs text-accent font-medium">#{tag}</span>
          ))}
        </div>
      )}

      {/* Image/Video */}
      {post.image && (
        <div className="relative mx-0 overflow-hidden">
          <img src={post.image} alt="Post" className="w-full aspect-square object-cover" />
          {post.isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 bg-primary/90 rounded-full flex items-center justify-center glow-primary">
                <Play size={20} className="fill-primary-foreground text-primary-foreground ml-1" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-all duration-200",
              liked ? "text-primary scale-110" : "text-muted-foreground hover:text-primary"
            )}
          >
            <Heart size={20} className={liked ? "fill-primary" : ""} />
            <span className="font-medium">{likeCount.toLocaleString()}</span>
          </button>
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent transition-colors">
            <MessageCircle size={20} />
            <span className="font-medium">{post.comments}</span>
          </button>
          <button className="text-muted-foreground hover:text-accent transition-colors">
            <Share2 size={20} />
          </button>
        </div>
        <button
          onClick={() => setSaved(!saved)}
          className={cn(
            "transition-all duration-200",
            saved ? "text-accent" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bookmark size={20} className={saved ? "fill-accent" : ""} />
        </button>
      </div>
    </article>
  );
}
