import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Send, Smile, Paperclip, Film, Plus, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  last_message: string | null;
  last_message_at: string | null;
  other_user?: { username: string; display_name: string | null; avatar_url: string | null };
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const fetchConversations = async () => {
    if (!user) return;
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("conversation_id, unread_count")
      .eq("user_id", user.id);

    if (!participants?.length) { setLoading(false); return; }

    const convIds = participants.map(p => p.conversation_id);
    const { data: convs } = await supabase
      .from("conversations")
      .select("*")
      .in("id", convIds)
      .order("last_message_at", { ascending: false });

    // Get other users for DMs
    const enriched: Conversation[] = [];
    for (const conv of convs ?? []) {
      const { data: otherParts } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conv.id)
        .neq("user_id", user.id);

      let otherUser = undefined;
      if (!conv.is_group && otherParts?.[0]) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, display_name, avatar_url")
          .eq("id", otherParts[0].user_id)
          .single();
        otherUser = profile ?? undefined;
      }

      const unread = participants.find(p => p.conversation_id === conv.id)?.unread_count ?? 0;
      enriched.push({ ...conv, other_user: otherUser, unread_count: unread, is_group: conv.is_group ?? false });
    }
    setConversations(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchConversations(); }, [user]);

  const fetchMessages = async (convId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setMessages(data ?? []);

    // Reset unread
    if (user) {
      await supabase
        .from("conversation_participants")
        .update({ unread_count: 0 })
        .eq("conversation_id", convId)
        .eq("user_id", user.id);
    }
  };

  useEffect(() => {
    if (!activeChat) return;
    fetchMessages(activeChat);

    const channel = supabase
      .channel(`messages-${activeChat}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeChat}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeChat]);

  const sendMessage = async () => {
    if (!inputValue.trim() || !user || !activeChat) return;
    const content = inputValue.trim();
    setInputValue("");

    await supabase.from("messages").insert({
      conversation_id: activeChat,
      sender_id: user.id,
      content,
    });

    // Update last message
    await supabase.from("conversations").update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    }).eq("id", activeChat);
  };

  const handleSearchUser = async (query: string) => {
    setSearchUser(query);
    if (query.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .neq("id", user?.id ?? "")
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(10);
    setSearchResults(data ?? []);
  };

  const startConversation = async (otherUserId: string) => {
    if (!user) return;
    // Check if conversation already exists
    const { data: myConvs } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (myConvs) {
      for (const mc of myConvs) {
        const { data: other } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", mc.conversation_id)
          .eq("user_id", otherUserId);
        if (other && other.length > 0) {
          setActiveChat(mc.conversation_id);
          setShowNewChat(false);
          return;
        }
      }
    }

    // Create new conversation
    const { data: conv } = await supabase
      .from("conversations")
      .insert({ created_by: user.id })
      .select()
      .single();

    if (conv) {
      await supabase.from("conversation_participants").insert([
        { conversation_id: conv.id, user_id: user.id },
        { conversation_id: conv.id, user_id: otherUserId },
      ]);
      setActiveChat(conv.id);
      await fetchConversations();
    }
    setShowNewChat(false);
  };

  const timeLabel = (date: string | null) => {
    if (!date) return "";
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return "now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  // Chat view
  if (activeChat) {
    const conv = conversations.find(c => c.id === activeChat);
    const chatName = conv?.is_group ? conv.name : (conv?.other_user?.display_name ?? conv?.other_user?.username ?? "Chat");

    return (
      <div className="flex flex-col h-[calc(100vh-120px)] animate-slide-in-right">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 glass">
          <button onClick={() => { setActiveChat(null); fetchConversations(); }} className="text-muted-foreground mr-1">
            <ArrowLeft size={20} />
          </button>
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground text-xs font-bold">
            {conv?.other_user?.avatar_url
              ? <img src={conv.other_user.avatar_url} className="w-9 h-9 rounded-full object-cover" />
              : (chatName?.[0] ?? "?").toUpperCase()
            }
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-foreground">{chatName}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.map(msg => (
            <div key={msg.id} className={cn("flex", msg.sender_id === user?.id ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                msg.sender_id === user?.id
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-secondary text-foreground rounded-bl-sm"
              )}>
                {msg.content}
                <span className="block text-[10px] mt-1 opacity-60 text-right">
                  {new Date(msg.created_at ?? "").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 pb-4 pt-2 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-secondary rounded-full px-4 py-2.5 border border-border">
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Message..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <button
            onClick={sendMessage}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
              inputValue ? "bg-primary shadow-glow-primary" : "bg-secondary"
            )}
          >
            <Send size={16} className={inputValue ? "text-primary-foreground" : "text-muted-foreground"} />
          </button>
        </div>
      </div>
    );
  }

  // New chat search
  if (showNewChat) {
    return (
      <div className="animate-fade-in pb-28 p-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setShowNewChat(false)} className="text-muted-foreground"><ArrowLeft size={20} /></button>
          <h2 className="font-display font-bold text-foreground">New Message</h2>
        </div>
        <Input
          value={searchUser}
          onChange={e => handleSearchUser(e.target.value)}
          placeholder="Search by username or name..."
          className="bg-secondary border-border mb-4"
        />
        <div className="flex flex-col gap-1">
          {searchResults.map(u => (
            <button
              key={u.id}
              onClick={() => startConversation(u.id)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/60 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground text-sm font-bold flex-shrink-0">
                {u.avatar_url ? <img src={u.avatar_url} className="w-10 h-10 rounded-full object-cover" /> : (u.display_name?.[0] ?? u.username[0]).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{u.display_name ?? u.username}</p>
                <p className="text-xs text-muted-foreground">@{u.username}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Conversation list
  return (
    <div className="animate-fade-in pb-28">
      <div className="px-4 py-3 flex items-center justify-between">
        <h2 className="font-display font-bold text-foreground">Messages</h2>
        <button onClick={() => setShowNewChat(true)} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
          <Plus size={16} />
        </button>
      </div>

      <div className="px-4 flex flex-col gap-1">
        {loading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-secondary rounded-xl animate-shimmer mb-2" />)
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <p>No conversations yet. Start chatting! 💬</p>
          </div>
        ) : conversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => setActiveChat(conv.id)}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/60 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold flex-shrink-0">
              {conv.other_user?.avatar_url
                ? <img src={conv.other_user.avatar_url} className="w-12 h-12 rounded-full object-cover" />
                : (conv.is_group ? (conv.name?.[0] ?? "G") : (conv.other_user?.display_name?.[0] ?? conv.other_user?.username?.[0] ?? "?")).toUpperCase()
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="font-semibold text-sm text-foreground">
                  {conv.is_group ? conv.name : (conv.other_user?.display_name ?? conv.other_user?.username ?? "Chat")}
                </p>
                <span className="text-xs text-muted-foreground">{timeLabel(conv.last_message_at)}</span>
              </div>
              <p className={cn("text-xs truncate", conv.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                {conv.last_message ?? "No messages yet"}
              </p>
            </div>
            {conv.unread_count > 0 && (
              <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {conv.unread_count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
