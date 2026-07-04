import { FormEvent, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "../lib/toast";
import { chatApi } from "../api/endpoints";
import { apiErrorMessage } from "../api/client";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../hooks/useAuth";
import { Message } from "../types";

export default function Chat() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const socketRef = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [othersTyping, setOthersTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!roomId) return;
    chatApi.getMessages(roomId)
      .then(setMessages)
      .catch((err) => toast.error(apiErrorMessage(err, "Could not load chat history")))
      .finally(() => setLoading(false));
  }, [roomId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !roomId) return;

    socket.emit("join-room", roomId);

    const onMessage = (msg: Message) => setMessages((prev) => [...prev, msg]);
    const onTyping = () => setOthersTyping(true);
    const onStopTyping = () => setOthersTyping(false);
    const onError = (e: { message: string }) => toast.error(e.message);

    socket.on("receive-message", onMessage);
    socket.on("typing", onTyping);
    socket.on("stop-typing", onStopTyping);
    socket.on("error", onError);

    return () => {
      socket.off("receive-message", onMessage);
      socket.off("typing", onTyping);
      socket.off("stop-typing", onStopTyping);
      socket.off("error", onError);
    };
    // socketRef.current identity is stable per connection via useSocket
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, socketRef.current]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleTyping() {
    if (!roomId) return;
    socketRef.current?.emit("typing", { roomId });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit("stop-typing", { roomId });
    }, 1500);
  }

  function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || !roomId) return;
    socketRef.current?.emit("send-message", { roomId, content: text.trim() });
    setText("");
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-2xl flex-col px-4 py-6">
      <h1 className="font-display text-2xl font-semibold">Chat</h1>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-xl border border-ink/10 p-4 dark:border-sand/10">
        {loading ? (
          <p className="text-ink/50 dark:text-sand/50">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-ink/50 dark:text-sand/50">Say hello — this is the start of your conversation.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.senderId === user?.id ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                m.senderId === user?.id ? "bg-teal text-sand" : "bg-ink/5 dark:bg-sand/10"
              }`}>
                <p>{m.content}</p>
                <p className="mt-1 text-[10px] opacity-60">{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          ))
        )}
        {othersTyping && <p className="text-xs italic text-ink/40 dark:text-sand/40">Typing…</p>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="mt-4 flex gap-2">
        <input
          value={text}
          onChange={(e) => { setText(e.target.value); handleTyping(); }}
          placeholder="Type a message"
          className="focus-ring flex-1 rounded-lg border border-ink/15 bg-transparent px-3 py-2 dark:border-sand/15"
        />
        <button className="focus-ring rounded-lg bg-teal px-4 py-2 font-medium text-sand hover:opacity-90">Send</button>
      </form>
    </div>
  );
}
