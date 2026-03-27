import { useState, useRef, useEffect } from "react";

export default function ChatPanel({ messages, onSend, isLoading, disabled }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setInput("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.length === 0 && !isLoading && (
          <p className="chat-empty">
            Tell me what code to write. For example: "add a for loop from 0 to arr.length"
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-msg chat-msg-${msg.role}`}>
            <span className="chat-msg-label">
              {msg.role === "user" ? "You" : "Agent"}
            </span>
            <p className="chat-msg-content">{msg.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="chat-msg chat-msg-assistant">
            <span className="chat-msg-label">Agent</span>
            <p className="chat-msg-content chat-thinking">Thinking...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 500))}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Challenge complete" : "Tell me what code to write..."}
          disabled={isLoading || disabled}
          rows={2}
        />
        <button
          className="btn btn-primary chat-send-btn"
          type="submit"
          disabled={!input.trim() || isLoading || disabled}
        >
          Send
        </button>
      </form>
    </div>
  );
}
