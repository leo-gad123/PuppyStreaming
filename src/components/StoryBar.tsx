import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { X, Plus } from "lucide-react";

interface Story {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  profiles?: { username: string; display_name: string | null; avatar_url: string | null } | null;
}

export default function StoryBar() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [viewStory, setViewStory] = useState<Story | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchStories = async () => {
    const { data } = await supabase
      .from("stories")
      .select("*, profiles!stories_user_id_fkey(username, display_name, avatar_url)")
      .order("created_at", { ascending: false });
    setStories((data as unknown as Story[]) ?? []);
  };

  useEffect(() => { fetchStories(); }, []);

  const handleAddStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("stories").upload(path, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from("stories").getPublicUrl(path);
      await supabase.from("stories").insert({ user_id: user.id, image_url: urlData.publicUrl });
      await fetchStories();
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  // Group stories by user - show one per user
  const userStories = stories.reduce((acc, s) => {
    if (!acc.find(x => x.user_id === s.user_id)) acc.push(s);
    return acc;
  }, [] as Story[]);

  return (
    <>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 py-3">
        {/* Add Story */}
        <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
          <div className="relative w-16 h-16 rounded-full border-2 border-dashed border-primary/60 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus size={20} className="text-primary" />
              )}
            </div>
          </div>
          <span className="text-xs text-muted-foreground">Add Story</span>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAddStory} className="hidden" />
        </button>

        {/* User stories */}
        {userStories.map((story) => (
          <button key={story.id} onClick={() => setViewStory(story)} className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
            <div className="p-0.5 rounded-full story-ring">
              <div className="p-0.5 bg-background rounded-full">
                {story.profiles?.avatar_url ? (
                  <img src={story.profiles.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover group-hover:scale-105 transition-transform duration-200" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold text-sm">
                    {(story.profiles?.display_name?.[0] ?? story.profiles?.username?.[0] ?? "?").toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[64px]">
              {story.user_id === user?.id ? "Your Story" : (story.profiles?.display_name?.split(" ")[0] ?? story.profiles?.username ?? "User")}
            </span>
          </button>
        ))}
      </div>

      {/* Story Viewer */}
      {viewStory && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setViewStory(null)}>
          <button className="absolute top-4 right-4 text-white z-10"><X size={24} /></button>
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground">
              {viewStory.profiles?.avatar_url
                ? <img src={viewStory.profiles.avatar_url} className="w-8 h-8 rounded-full object-cover" />
                : (viewStory.profiles?.username?.[0] ?? "?").toUpperCase()
              }
            </div>
            <span className="text-white text-sm font-medium">{viewStory.profiles?.display_name ?? viewStory.profiles?.username}</span>
          </div>
          <img src={viewStory.image_url} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </>
  );
}
