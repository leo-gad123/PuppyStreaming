import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit3, Film, Star, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Movie {
  id: string;
  title: string;
  genre: string | null;
  year: number | null;
  rating: number;
  cover_url: string | null;
  watching_count: number;
  is_featured: boolean;
  status: string;
}

const GENRES = ["Action", "Sci-Fi", "Thriller", "Drama", "Comedy", "Horror", "Romance", "Documentary"];

export default function MoviesSection() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMovie, setEditMovie] = useState<Partial<Movie> | null>(null);
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const emptyForm = { title: "", description: "", genre: "Action", year: 2024, rating: 7.0, cover_url: "", video_url: "", is_featured: false };
  const [form, setForm] = useState(emptyForm);

  const fetchMovies = async () => {
    const { data } = await supabase.from("movies").select("*").order("created_at", { ascending: false });
    setMovies(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchMovies(); }, []);

  const openEdit = (movie: Movie) => {
    setEditMovie(movie);
    setForm({ ...movie } as any);
    setCoverFile(null);
    setCoverPreview(movie.cover_url);
    setShowForm(true);
  };

  const openCreate = () => {
    setEditMovie(null);
    setForm(emptyForm as any);
    setCoverFile(null);
    setCoverPreview(null);
    setShowForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const uploadCover = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    setUploading(true);
    const { error } = await supabase.storage.from("movie-covers").upload(path, file);
    setUploading(false);
    if (error) { console.error("Upload error:", error); return null; }
    const { data } = supabase.storage.from("movie-covers").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!form.title) return;
    setSaving(true);
    const adminId = (await supabase.auth.getUser()).data.user?.id;

    let finalForm = { ...form };

    // Upload cover if file selected
    if (coverFile) {
      const url = await uploadCover(coverFile);
      if (url) finalForm.cover_url = url;
    }

    if (editMovie?.id) {
      await supabase.from("movies").update(finalForm).eq("id", editMovie.id);
      await supabase.from("activity_logs").insert({ admin_id: adminId, action: "movie_updated", target_type: "movie", target_id: editMovie.id });
    } else {
      const { data } = await supabase.from("movies").insert(finalForm).select().single();
      await supabase.from("activity_logs").insert({ admin_id: adminId, action: "movie_created", target_type: "movie", target_id: data?.id });
    }
    setShowForm(false);
    setCoverFile(null);
    setCoverPreview(null);
    await fetchMovies();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this movie?")) return;
    const adminId = (await supabase.auth.getUser()).data.user?.id;
    await supabase.from("movies").update({ status: "removed" }).eq("id", id);
    await supabase.from("activity_logs").insert({ admin_id: adminId, action: "movie_removed", target_type: "movie", target_id: id });
    await fetchMovies();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="gradient-primary text-primary-foreground shadow-glow-primary text-sm">
          <Plus size={16} /> Add Movie
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="gradient-card border border-white/5 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-bold text-foreground mb-5">{editMovie ? "Edit Movie" : "Add Movie"}</h3>
            <div className="space-y-3">
              <Input placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary border-border" />
              <textarea
                placeholder="Description"
                value={(form as any).description ?? ""}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none h-20 outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={(form as any).genre ?? ""}
                  onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}
                  className="bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none"
                >
                  {GENRES.map(g => <option key={g}>{g}</option>)}
                </select>
                <Input type="number" placeholder="Year" value={(form as any).year ?? ""} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} className="bg-secondary border-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" step="0.1" min="0" max="10" placeholder="Rating (0-10)" value={(form as any).rating ?? ""} onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))} className="bg-secondary border-border" />
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Cover Image</label>
                <div className="flex gap-3 items-start">
                  <label className="flex-1 flex items-center gap-2 bg-secondary border border-dashed border-border rounded-lg px-4 py-3 cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload size={16} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{coverFile ? coverFile.name : "Upload from device"}</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                  {coverPreview && (
                    <img src={coverPreview} alt="Preview" className="w-14 h-20 object-cover rounded-lg border border-border flex-shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Or paste a URL below</p>
                <Input placeholder="Cover Image URL" value={(form as any).cover_url ?? ""} onChange={e => { setForm(f => ({ ...f, cover_url: e.target.value })); setCoverFile(null); setCoverPreview(e.target.value || null); }} className="bg-secondary border-border mt-1" />
              </div>

              <Input placeholder="Video URL" value={(form as any).video_url ?? ""} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} className="bg-secondary border-border" />
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={(form as any).is_featured ?? false} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="accent-primary" />
                Featured Movie
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <Button variant="outline" onClick={() => { setShowForm(false); setCoverFile(null); setCoverPreview(null); }} className="flex-1 border-border">Cancel</Button>
              <Button onClick={handleSave} disabled={saving || uploading} className="flex-1 gradient-primary text-primary-foreground">
                {uploading ? "Uploading..." : saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Movies Table */}
      <div className="gradient-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium text-left">Movie</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium text-left">Genre</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium text-left">Rating</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium text-left">Watching</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium text-left">Status</th>
                <th className="px-4 py-3 text-xs text-muted-foreground font-medium text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array(4).fill(0).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td colSpan={6} className="px-4 py-4"><div className="h-4 bg-secondary rounded animate-shimmer" /></td>
                </tr>
              )) : movies.map((movie) => (
                <tr key={movie.id} className="border-b border-white/5 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {movie.cover_url
                        ? <img src={movie.cover_url} alt="" className="w-10 h-14 object-cover rounded-lg flex-shrink-0" />
                        : <div className="w-10 h-14 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0"><Film size={16} className="text-muted-foreground" /></div>
                      }
                      <div>
                        <p className="font-medium text-foreground text-xs">{movie.title}</p>
                        <p className="text-muted-foreground text-[10px]">{movie.year}</p>
                        {movie.is_featured && <span className="text-[10px] text-primary font-medium">★ Featured</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{movie.genre}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-yellow-400 text-xs font-semibold">
                      <Star size={11} className="fill-current" /> {movie.rating}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{movie.watching_count.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${movie.status === "active" ? "text-green-400 bg-green-400/10" : "text-destructive bg-destructive/10"}`}>
                      {movie.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(movie)} className="h-7 w-7 p-0 text-muted-foreground hover:text-primary">
                        <Edit3 size={13} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(movie.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                        <Trash2 size={13} />
                      </Button>
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
