import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Image, Send, X } from "lucide-react";

interface CreatePostProps {
  onCreated: () => void;
}

export default function CreatePost({ onCreated }: CreatePostProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handlePost = async () => {
    if (!content.trim() || !user) return;
    setPosting(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("post-images").upload(path, imageFile);
      if (!error) {
        const { data } = supabase.storage.from("post-images").getPublicUrl(path);
        imageUrl = data.publicUrl;
      }
    }

    // Extract tags from content
    const tags = content.match(/#\w+/g)?.map(t => t.slice(1)) ?? null;

    await supabase.from("posts").insert({
      user_id: user.id,
      content: content.trim(),
      image_url: imageUrl,
      tags,
    });

    setContent("");
    setImageFile(null);
    setImagePreview(null);
    setPosting(false);
    onCreated();
  };

  return (
    <div className="gradient-card rounded-2xl border border-white/5 p-4">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="What are you watching? 🎬"
        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none min-h-[60px]"
        rows={2}
      />
      {imagePreview && (
        <div className="relative mt-2 mb-2">
          <img src={imagePreview} alt="" className="w-full max-h-48 object-cover rounded-xl" />
          <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
            <X size={14} className="text-white" />
          </button>
        </div>
      )}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
        <button onClick={() => fileRef.current?.click()} className="text-muted-foreground hover:text-primary transition-colors">
          <Image size={20} />
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
        </button>
        <button
          onClick={handlePost}
          disabled={!content.trim() || posting}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold gradient-primary text-primary-foreground disabled:opacity-50 transition-opacity"
        >
          {posting ? "Posting..." : <><Send size={14} /> Post</>}
        </button>
      </div>
    </div>
  );
}
