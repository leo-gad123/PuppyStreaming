import { useState } from "react";
import { Star, Play, Users, Plus, ChevronRight } from "lucide-react";

interface Movie {
  id: number;
  title: string;
  genre: string;
  rating: number;
  year: number;
  image: string;
  watching?: number;
}

interface MovieCardProps {
  movie: Movie;
  variant?: "portrait" | "landscape" | "featured";
}

export default function MovieCard({ movie, variant = "portrait" }: MovieCardProps) {
  const [inList, setInList] = useState(false);

  if (variant === "featured") {
    return (
      <div className="relative rounded-2xl overflow-hidden min-h-[220px] border border-white/5 shadow-card group cursor-pointer">
        <img src={movie.image} alt={movie.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-medium">
              {movie.genre}
            </span>
            <span className="text-xs text-muted-foreground">{movie.year}</span>
          </div>
          <h3 className="font-display font-bold text-lg text-foreground mb-2">{movie.title}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star size={13} className="fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold text-foreground">{movie.rating}</span>
              </div>
              {movie.watching && (
                <div className="flex items-center gap-1 text-accent text-xs">
                  <Users size={12} />
                  <span>{movie.watching} watching</span>
                </div>
              )}
            </div>
            <button className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-coral-dark transition-colors">
              <Play size={12} className="fill-current" /> Watch
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "landscape") {
    return (
      <div className="flex gap-3 p-3 gradient-card rounded-xl border border-white/5 group cursor-pointer hover:border-primary/20 transition-all duration-200">
        <div className="relative flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden">
          <img src={movie.image} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="flex-1 min-w-0 py-1">
          <h4 className="font-semibold text-foreground text-sm truncate mb-1">{movie.title}</h4>
          <div className="flex items-center gap-1 mb-1">
            <Star size={11} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-muted-foreground">{movie.rating} · {movie.year}</span>
          </div>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{movie.genre}</span>
          {movie.watching && (
            <div className="flex items-center gap-1 mt-2 text-accent text-xs">
              <Users size={11} />
              <span>{movie.watching} watching now</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end justify-between py-1">
          <button
            onClick={() => setInList(!inList)}
            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-200 ${inList ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}
          >
            <Plus size={14} className={inList ? "rotate-45" : ""} />
          </button>
          <ChevronRight size={16} className="text-muted-foreground" />
        </div>
      </div>
    );
  }

  // portrait (default)
  return (
    <div className="group cursor-pointer">
      <div className="relative w-32 rounded-xl overflow-hidden border border-white/5 shadow-card group-hover:shadow-card-hover transition-all duration-300">
        <img src={movie.image} alt={movie.title} className="w-32 h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
          <button className="w-full bg-primary/90 text-primary-foreground text-xs font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1">
            <Play size={11} className="fill-current" /> Play
          </button>
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-background/70 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
          <Star size={10} className="fill-yellow-400 text-yellow-400" />
          <span className="text-[10px] font-bold text-foreground">{movie.rating}</span>
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <p className="text-xs font-semibold text-foreground truncate w-32">{movie.title}</p>
        <p className="text-[10px] text-muted-foreground">{movie.genre}</p>
      </div>
    </div>
  );
}
