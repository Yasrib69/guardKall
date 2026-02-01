import GeminiChat from "./GeminiChat.jsx";

export default function App() {
  return (
    <div className="page">
      <header className="header">
        <h1>Gemini Chat</h1>
        <p>Streaming chat powered by your backend proxy.</p>
      </header>

      <main className="main">
        <GeminiChat />
      </main>
    </div>
  );
}
