import movie1 from "@/assets/movie1.jpg";
import movie2 from "@/assets/movie2.jpg";
import movie3 from "@/assets/movie3.jpg";
import avatar1 from "@/assets/avatar1.jpg";
import avatar2 from "@/assets/avatar2.jpg";
import { Users, Play, Plus, Crown, Clock, Radio } from "lucide-react";

const activeParties = [
  {
    id: 1,
    movie: "Neon Galaxy",
    image: movie2,
    host: "Alex Rivera",
    hostAvatar: avatar2,
    attendees: [avatar1, avatar2, avatar1, avatar2],
    attendeeCount: 14,
    status: "live",
    startedAt: "Started 23 min ago",
  },
  {
    id: 2,
    movie: "The Dark Cipher",
    image: movie3,
    host: "Movie Nerds 🎬",
    hostAvatar: avatar1,
    attendees: [avatar2, avatar1, avatar2],
    attendeeCount: 7,
    status: "live",
    startedAt: "Started 1h ago",
  },
];

const upcomingParties = [
  {
    id: 3,
    movie: "Shadow Protocol",
    image: movie1,
    host: "Maya Kim",
    hostAvatar: avatar1,
    scheduledFor: "Tonight at 9:00 PM",
    rsvpCount: 23,
  },
];

export default function PartyPage() {
  return (
    <div className="animate-fade-in pb-28 px-4">
      {/* Create Party Button */}
      <div className="py-4">
        <button className="w-full gradient-primary text-primary-foreground rounded-2xl py-4 flex items-center justify-center gap-3 font-semibold text-base shadow-glow-primary hover:opacity-90 transition-opacity active:scale-95">
          <Plus size={20} />
          Create Watch Party
        </button>
      </div>

      {/* Live Now */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <Radio size={14} className="text-primary animate-pulse" />
            <h2 className="font-display font-bold text-foreground">Live Now</h2>
          </div>
          <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium border border-primary/25">
            {activeParties.length} Active
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {activeParties.map(party => (
            <div key={party.id} className="gradient-card rounded-2xl overflow-hidden border border-white/5 shadow-card">
              <div className="relative h-36">
                <img src={party.image} alt={party.movie} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-primary/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-pulse" />
                  <span className="text-primary-foreground text-xs font-bold">LIVE</span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div>
                    <h3 className="font-display font-bold text-foreground text-base">{party.movie}</h3>
                    <p className="text-muted-foreground text-xs">{party.startedAt}</p>
                  </div>
                  <button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all">
                    <Play size={13} className="fill-current" /> Join
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {party.attendees.slice(0, 3).map((av, i) => (
                      <img key={i} src={av} alt="" className="w-6 h-6 rounded-full object-cover border-2 border-card" />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    <span className="text-foreground font-semibold">{party.attendeeCount}</span> watching
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Crown size={12} className="text-yellow-400" />
                  <span className="text-xs text-muted-foreground">{party.host}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} className="text-accent" />
          <h2 className="font-display font-bold text-foreground">Upcoming Parties</h2>
        </div>
        <div className="flex flex-col gap-3">
          {upcomingParties.map(party => (
            <div key={party.id} className="gradient-card rounded-2xl overflow-hidden border border-white/5 flex gap-3 p-3">
              <img src={party.image} alt={party.movie} className="w-20 h-28 object-cover rounded-xl flex-shrink-0" />
              <div className="flex-1 py-1">
                <h3 className="font-semibold text-foreground mb-1">{party.movie}</h3>
                <div className="flex items-center gap-1.5 mb-2">
                  <img src={party.hostAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                  <span className="text-xs text-muted-foreground">by {party.host}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-accent mb-3">
                  <Clock size={11} />
                  <span>{party.scheduledFor}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    <span className="text-foreground font-semibold">{party.rsvpCount}</span> RSVPs
                  </span>
                  <button className="bg-secondary hover:bg-surface-overlay border border-border text-foreground text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                    <Users size={11} /> RSVP
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
