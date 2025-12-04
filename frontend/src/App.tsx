import { useState, useEffect } from "react";
import { initLLM, sendPrompt } from "./llm/llm"
import * as webllm from "@mlc-ai/web-llm";
import './App.css'

export default function ChatbotUI() {
  // for llm engine
  const [progress, setProgress] = useState("Loading LLM...");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

    useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await initLLM(setProgress); // Your async function
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array = run once on mount

  // for messages
  const [messages, setMessages] = useState<webllm.ChatCompletionMessageParam[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: webllm.ChatCompletionMessageParam = {
      role: "user",
      content: input,
    };

    // Add user message immediately
    const messageWithUser = [...messages, userMsg];
    setMessages(messageWithUser);
    setInput("");

    try {
      // Send the updated messages array (with user message)
      const replyStream = await sendPrompt(messageWithUser);
      
      let fullResponse = "";
      
      // Process stream and update UI incrementally
      for await (const chunk of replyStream) {
        const chunkContent = chunk.choices[0]?.delta?.content || "";
        fullResponse += chunkContent;
        
        // Create temporary assistant message
        const tempAssistantMsg: webllm.ChatCompletionMessageParam = {
          role: "assistant",
          content: fullResponse,
        };
        
        // Update UI with streaming response
        setMessages([...messageWithUser, tempAssistantMsg]);
      }
      
      // Final update with complete message (optional - cleaner)
      const finalAssistantMsg: webllm.ChatCompletionMessageParam = {
        role: "assistant",
        content: fullResponse,
      };
      setMessages([...messageWithUser, finalAssistantMsg]);
      
    } catch (error) {
      console.error("Error sending message:", error);
      // Optional: Add error message to chat
      const errorMsg: webllm.ChatCompletionMessageParam = {
        role: "assistant",
        content: "Sorry, an error occurred while processing your message.",
      };
      setMessages([...messageWithUser, errorMsg]);
    }
  };

  // helper
  const renderContent = (content: string | webllm.ChatCompletionContentPart[] | null | undefined) => {
    if (!content) return "";
    if (typeof content === "string") return content;

    return "none"
    // array of ChatCompletionContentPart
    // return content.map(part => part.text || "").join("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };


  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-title" style={{ padding: '8px' }} >
          <h2>Alex Ai</h2>
          <span className="status" >{progress}</span>
          <span className="status">Online</span>
        </div>
      </div>

      <div className="messages-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message-wrapper ${message.role}`}
          >
            <div className="message">
              <div className="message-avatar">
                {message.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-text">{renderContent(message.content)}</div>
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="message-wrapper assistant">
            <div className="message">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="chat-input"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className={`send-button ${input.trim() && !loading ? 'active' : ''}`}
          >
            Send
          </button>
        </div>
        <div className="input-hint">
          Press Enter to send • Shift + Enter for new line
        </div>
      </div>
    </div>
    
  );
}
