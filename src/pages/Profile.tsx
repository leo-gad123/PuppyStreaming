import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Grid3X3, Bookmark, Film, Star, LogOut, Shield, Camera, X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
}

const tabs = [
  { id: "posts", icon: Grid3X3 },
  { id: "saved", icon: Bookmark },
  { id: "movies", icon: Film },
];

export default function ProfilePage() {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchProfile = () => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  };

  useEffect(() => { fetchProfile(); }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    // Upload file (upsert by removing old first)
    await supabase.storage.from("avatars").remove([path]);
    const { error } = await supabase.storage.from("avatars").upload(path, file);

    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${data.publicUrl}?t=${Date.now()}`; // cache bust
      await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : prev);
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const openEdit = () => {
    setEditForm({
      display_name: profile?.display_name ?? "",
      bio: profile?.bio ?? "",
    });
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({
      display_name: editForm.display_name.trim() || null,
      bio: editForm.bio.trim() || null,
    }).eq("id", user.id);
    setProfile(prev => prev ? { ...prev, display_name: editForm.display_name.trim() || null, bio: editForm.bio.trim() || null } : prev);
    setEditing(false);
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="animate-fade-in pb-28">
      <div className="relative h-36 bg-gradient-to-br from-primary/30 via-accent/20 to-background">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute top-4 right-4 flex gap-2">
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="w-9 h-9 glass rounded-full flex items-center justify-center text-primary"
              title="Admin Dashboard"
            >
              <Shield size={17} />
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="w-9 h-9 glass rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
            title="Sign Out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>

      <div className="px-5 -mt-10 relative z-10">
        <div className="flex items-end justify-between mb-4">
          {/* Avatar with upload */}
          <div className="relative group">
            <div className="p-0.5 rounded-full story-ring shadow-glow-primary">
              <div className="p-1 bg-background rounded-full">
                <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold overflow-hidden">
                  {uploading ? (
                    <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    (profile?.display_name?.[0] ?? profile?.username?.[0] ?? "?").toUpperCase()
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-background text-primary-foreground hover:scale-110 transition-transform"
            >
              <Camera size={13} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>

          <div className="flex gap-2 mb-2">
            <button
              onClick={openEdit}
              className="gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-xl hover:opacity-90 active:scale-95 transition-all"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-20 bg-secondary rounded-xl animate-shimmer mb-4" />
        ) : (
          <div className="mb-4">
            <h2 className="font-display font-bold text-xl text-foreground">{profile?.display_name ?? profile?.username}</h2>
            <p className="text-muted-foreground text-sm">@{profile?.username}</p>
            {profile?.bio && <p className="text-foreground text-sm mt-2 leading-relaxed">{profile.bio}</p>}
            {isAdmin && (
              <div className="flex items-center gap-1 mt-1.5">
                <Shield size={12} className="text-primary" />
                <span className="text-xs text-primary font-medium">Administrator</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-6 py-4 border-y border-border/50 mb-4">
          {[
            { label: "Following", value: profile?.following_count ?? 0 },
            { label: "Followers", value: profile?.followers_count ?? 0 },
            { label: "Posts", value: profile?.posts_count ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display font-bold text-lg text-foreground">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex border-b border-border/50 px-5 mb-4">
        {tabs.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center py-3 border-b-2 transition-all duration-200 ${
              activeTab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={20} />
          </button>
        ))}
      </div>

      <div className="px-4 text-center py-8 text-muted-foreground text-sm">
        {activeTab === "posts" && "Your posts will appear here"}
        {activeTab === "saved" && "Saved content will appear here"}
        {activeTab === "movies" && "Watched movies will appear here"}
      </div>

      {/* Edit Profile Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="gradient-card border border-white/5 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-foreground">Edit Profile</h3>
              <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Display Name</label>
                <Input
                  value={editForm.display_name}
                  onChange={e => setEditForm(f => ({ ...f, display_name: e.target.value }))}
                  placeholder="Your display name"
                  maxLength={50}
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  maxLength={160}
                  rows={3}
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-[10px] text-muted-foreground text-right mt-1">{editForm.bio.length}/160</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button variant="outline" onClick={() => setEditing(false)} className="flex-1 border-border">Cancel</Button>
              <Button onClick={handleSaveProfile} disabled={saving} className="flex-1 gradient-primary text-primary-foreground">
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
