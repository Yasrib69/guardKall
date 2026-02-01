import { useMemo, useRef, useState } from "react";

export default function GeminiChat() {
  const backend = import.meta.env.VITE_GEMINI_BACKEND || "http://localhost:5050";

  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! Ask me anything." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const assistantIndexRef = useRef(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function sendMessage() {
    const userText = input.trim();
    if (!userText || loading) return;

    setInput("");
    setLoading(true);

    // Add user message
    const next = [...messages, { role: "user", content: userText }];

    // Add an empty assistant message that we’ll stream into
    assistantIndexRef.current = next.length;
    next.push({ role: "assistant", content: "" });
    setMessages(next);

    try {
      const resp = await fetch(`${backend}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.filter((m, i) => i !== assistantIndexRef.current) // exclude empty assistant
        })
      });

      if (!resp.ok || !resp.body) {
        const text = await resp.text().catch(() => "");
        throw new Error(`Backend error: ${resp.status} ${text}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE frames
        // Each event ends with "\n\n"
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const frame of parts) {
          if (!frame.trim()) continue;
          const lines = frame.split("\n");
          const eventLine = lines.find((l) => l.startsWith("event:")) || "";
          const dataLine = lines.find((l) => l.startsWith("data:")) || "";

          const event = eventLine.replace("event:", "").trim();
          const dataStr = dataLine.replace("data:", "").trim();

          if (event === "token") {
            const data = JSON.parse(dataStr);
            const token = data.token || "";

            setMessages((prev) => {
              const idx = assistantIndexRef.current;
              const copy = [...prev];
              copy[idx] = { ...copy[idx], content: (copy[idx].content || "") + token };
              return copy;
            });
          }

          if (event === "error") {
            const data = JSON.parse(dataStr);
            throw new Error(data.error || "stream_error");
          }
        }
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ Error: ${e.message || e}` }
      ]);
    } finally {
      setLoading(false);
      assistantIndexRef.current = null;
    }
  }

  return (
    <div className="chat">
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <div className="role">{m.role}</div>
            <div className="content">{m.content}</div>
          </div>
        ))}
      </div>

      <div className="composer">
        <input
          value={input}
          placeholder={loading ? "Thinking..." : "Type a message..."}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={!canSend}>
          Send
        </button>
      </div>
    </div>
  );
}
