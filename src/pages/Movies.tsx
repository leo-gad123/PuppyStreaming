import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Clock, Sparkles, Star } from "lucide-react";

interface Movie {
  id: string;
  title: string;
  genre: string | null;
  year: number | null;
  rating: number;
  cover_url: string | null;
  watching_count: number;
  is_featured: boolean;
  description: string | null;
}

const categories = ["All", "Action", "Sci-Fi", "Thriller", "Drama", "Comedy", "Horror"];

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    let query = supabase.from("movies").select("*").eq("status", "active").order("watching_count", { ascending: false });
    if (activeCategory !== "All") query = query.eq("genre", activeCategory);
    query.then(({ data }) => {
      setMovies(data ?? []);
      setLoading(false);
    });
  }, [activeCategory]);

  const featured = movies.filter((m) => m.is_featured);
  const rest = movies.filter((m) => !m.is_featured);

  return (
    <div className="animate-fade-in pb-28">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground shadow-glow-primary"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-surface-overlay"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="px-4 space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-36 gradient-card rounded-2xl border border-white/5 animate-shimmer" />
          ))}
        </div>
      ) : (
        <>
          {featured.length > 0 && (
            <section className="px-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-primary" />
                  <h2 className="font-display font-bold text-foreground">Trending Now</h2>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {featured.map((movie) => (
                  <div key={movie.id} className="gradient-card rounded-2xl border border-white/5 overflow-hidden flex gap-3 p-3">
                    {movie.cover_url
                      ? <img src={movie.cover_url} alt={movie.title} className="w-24 h-32 object-cover rounded-xl flex-shrink-0" />
                      : <div className="w-24 h-32 bg-secondary rounded-xl flex-shrink-0" />
                    }
                    <div className="flex-1 py-1">
                      <h3 className="font-semibold text-foreground mb-1">{movie.title}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{movie.genre}</span>
                        <span className="text-xs text-muted-foreground">{movie.year}</span>
                      </div>
                      {movie.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">{movie.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-yellow-400 text-xs font-semibold">
                          <Star size={11} className="fill-current" /> {movie.rating}
                        </span>
                        <span className="text-xs text-muted-foreground">{movie.watching_count.toLocaleString()} watching</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {rest.length > 0 && (
            <section className="mb-6">
              <div className="flex items-center justify-between px-4 mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-accent" />
                  <h2 className="font-display font-bold text-foreground">More to Watch</h2>
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2">
                {rest.map((movie) => (
                  <div key={movie.id} className="flex-shrink-0 w-32">
                    {movie.cover_url
                      ? <img src={movie.cover_url} alt={movie.title} className="w-32 h-44 object-cover rounded-xl" />
                      : <div className="w-32 h-44 bg-secondary rounded-xl" />
                    }
                    <p className="text-xs font-semibold text-foreground mt-2 truncate">{movie.title}</p>
                    <span className="flex items-center gap-0.5 text-yellow-400 text-[10px]">
                      <Star size={9} className="fill-current" /> {movie.rating}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
