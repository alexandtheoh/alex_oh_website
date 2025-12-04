import { useState, useEffect } from "react";
import { initLLM, sendPrompt } from "./llm/llm"
import * as webllm from "@mlc-ai/web-llm";

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


  return (
    <div className="w-full h-screen flex flex-col p-4 gap-4 bg-gray-100">
      <div className="text-2xl font-bold">WebLLM Chatbot</div>

      <div style={{ padding: 20 }}>
        <h2>Loading LLM…</h2>
        <p>{progress}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-white rounded-2xl shadow">
        {messages.map((m, i) => (
          <div key={i} className="mb-3">
            <div className="font-semibold capitalize">{m.role}</div>
            <div>{renderContent(m.content)}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 p-3 rounded-xl border shadow"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}
