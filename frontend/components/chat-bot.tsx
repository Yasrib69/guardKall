"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! 👋 I'm Xguardkall. How can I help you with your setup today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    // Simulate bot response
    setTimeout(() => {
      const botResponses = [
        "I'm here to help! Have you enabled the Silence Unknown Callers feature yet?",
        "That's a great question! Let me know if you need help with any of the setup steps.",
        "Thanks for letting me know! Is there anything else I can assist you with?",
        "I'm always here if you have more questions about protecting your phone from spam calls.",
        "Would you like tips on using the other safety features in GuardKall?",
      ]

      const randomResponse =
        botResponses[Math.floor(Math.random() * botResponses.length)]

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: "bot",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
      setIsLoading(false)
    }, 500)
  }

  return (
    <>
      {/* Chat Button - 3D Popping Effect */}
      <style jsx>{`
        @keyframes pop-in {
          0% {
            transform: scale(0) translateY(20px);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }

        @keyframes float-bounce {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes glow-border {
          0%, 100% {
            box-shadow: 0 0 12px rgba(34, 197, 94, 0.5), inset 0 0 12px rgba(34, 197, 94, 0.1);
          }
          50% {
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.8), inset 0 0 16px rgba(34, 197, 94, 0.2);
          }
        }

        .chat-button {
          animation: pop-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .chat-button:hover {
          animation: float-bounce 1s ease-in-out infinite;
        }

        .chat-window {
          animation: glow-border 2s ease-in-out infinite;
        }
      `}</style>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chat-button fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/40 flex items-center justify-center transition-all hover:shadow-xl hover:shadow-green-500/60 hover:scale-110"
        aria-label="Open chat"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window fixed bottom-24 right-6 z-40 w-72 h-96 bg-black rounded-2xl shadow-2xl border border-green-500/60 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white text-sm">Xguardkall</h3>
              <p className="text-xs text-green-100">Support Bot</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-green-700 rounded-full p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-black">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-xs ${
                    message.sender === "user"
                      ? "bg-green-600 text-white rounded-br-none"
                      : "bg-gray-800 text-gray-100 rounded-bl-none"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-gray-100 px-3 py-2 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-black border-t border-green-500/30 p-3 flex gap-2">
            <Input
              type="text"
              placeholder="Type message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              className="flex-1 bg-gray-900 border-green-500/30 text-white placeholder-gray-500 text-xs focus:border-green-500 focus:ring-green-500/20"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="bg-green-600 hover:bg-green-700 text-white p-2 h-auto w-auto"
            >
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
