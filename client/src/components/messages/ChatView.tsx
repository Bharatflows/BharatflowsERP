import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";
import { messagingService, Message } from "../../services/messagingService";
import { useSocket } from "../../hooks/useSocket";

interface ChatViewProps {
  chat: {
    id: string;
    name: string;
    type: string;
    avatar: string;
    online: boolean;
  };
  onBack: () => void;
}

export function ChatView({ chat, onBack }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isConnected,
    sendMessage: socketSendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    joinConversation,
    leaveConversation,
    onNewMessage,
    onTypingStart,
    onTypingStop,
  } = useSocket();

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await messagingService.getMessages(chat.id, { limit: 50 });
        if (response.data?.data?.items) {
          setMessages(response.data.data.items);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        toast.error("Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    joinConversation(chat.id);
    markAsRead(chat.id);

    return () => {
      leaveConversation(chat.id);
    };
  }, [chat.id, joinConversation, leaveConversation, markAsRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Listen for new messages
  useEffect(() => {
    const cleanup = onNewMessage((message) => {
      if (message.conversationId === chat.id) {
        setMessages((prev) => [...prev, message]);
        markAsRead(chat.id);
      }
    });
    return cleanup;
  }, [chat.id, onNewMessage, markAsRead]);

  // Listen for typing indicators
  useEffect(() => {
    const cleanupStart = onTypingStart((event) => {
      if (event.conversationId === chat.id) {
        setTypingUsers((prev) =>
          prev.includes(event.userName) ? prev : [...prev, event.userName]
        );
      }
    });

    const cleanupStop = onTypingStop((event) => {
      if (event.conversationId === chat.id) {
        setTypingUsers((prev) => prev.filter((name) => name !== event.userId));
      }
    });

    return () => {
      cleanupStart();
      cleanupStop();
    };
  }, [chat.id, onTypingStart, onTypingStop]);

  // Handle typing indicator
  const handleTyping = () => {
    startTyping(chat.id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(chat.id);
    }, 2000);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage;
    setNewMessage("");
    stopTyping(chat.id);

    if (isConnected) {
      // Use WebSocket for real-time
      setSending(true);
      const sent = await socketSendMessage(chat.id, messageContent);
      setSending(false);

      if (!sent) {
        // Fallback to REST API
        try {
          const response = await messagingService.sendMessage(chat.id, {
            content: messageContent,
          });
          if (response.data?.data) {
            setMessages((prev) => [...prev, response.data!.data!]);
          }
        } catch (error) {
          toast.error("Failed to send message");
          setNewMessage(messageContent); // Restore message
        }
      }
    } else {
      // Use REST API if not connected
      try {
        setSending(true);
        const response = await messagingService.sendMessage(chat.id, {
          content: messageContent,
        });
        if (response.data?.data) {
          setMessages((prev) => [...prev, response.data!.data!]);
        }
      } catch (error) {
        toast.error("Failed to send message");
        setNewMessage(messageContent);
      } finally {
        setSending(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const currentUserId = localStorage.getItem("userId");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SENDING":
        return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
      case "SENT":
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case "DELIVERED":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case "READ":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {chat.avatar}
              </AvatarFallback>
            </Avatar>
            {chat.online && (
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-background rounded-full" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-foreground">{chat.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {typingUsers.length > 0
                  ? `${typingUsers.join(", ")} typing...`
                  : chat.online
                    ? "Online"
                    : "Offline"}
              </span>
              {isConnected && (
                <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700">
                  Live
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Contact Info</DropdownMenuItem>
              <DropdownMenuItem>Search in Chat</DropdownMenuItem>
              <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
              <DropdownMenuItem>Clear Chat</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Block Contact</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>No messages yet</p>
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isSent = message.senderId === currentUserId;

              return (
                <div
                  key={message.id}
                  className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${isSent
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                      }`}
                  >
                    {!isSent && chat.type === "Group" && (
                      <p className="text-xs font-medium mb-1 opacity-70">
                        {message.sender?.name}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div
                      className={`flex items-center gap-1 mt-1 ${isSent ? "justify-end" : "justify-start"
                        }`}
                    >
                      <span className="text-[10px] opacity-70">
                        {formatTime(message.createdAt)}
                      </span>
                      {isSent && getStatusIcon(message.status)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            className="flex-1"
            disabled={sending}
          />
          <Button variant="ghost" size="icon" className="shrink-0">
            <Smile className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="shrink-0"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
