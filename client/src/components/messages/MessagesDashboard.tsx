import { useState, useEffect } from "react";
import {
  MessageSquare,
  Users,
  MessageCircle,
  TrendingUp,
  Clock,
  CheckCheck,
  Send,
  FileText,
  ArrowRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { toast } from "sonner";
import { messagingService, Conversation } from "../../services/messagingService";
import { useSocket } from "../../hooks/useSocket";

interface MessagesDashboardProps {
  onNavigate: (tab: "chats" | "groups" | "contacts") => void;
}

interface Stats {
  totalMessages: number;
  activeChats: number;
  groupChats: number;
  unreadCount: number;
}

const quickActions = [
  {
    title: "New Chat",
    description: "Start a conversation",
    icon: MessageCircle,
    color: "bg-blue-600",
    action: "chats",
  },
  {
    title: "New Group",
    description: "Create a group chat",
    icon: Users,
    color: "bg-emerald-600",
    action: "groups",
  },
  {
    title: "Contacts",
    description: "Manage contacts",
    icon: FileText,
    color: "bg-orange-600",
    action: "contacts",
  },
];

export function MessagesDashboard({ onNavigate }: MessagesDashboardProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalMessages: 0,
    activeChats: 0,
    groupChats: 0,
    unreadCount: 0,
  });

  const { isConnected } = useSocket();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await messagingService.getConversations({ limit: 10 });

      if (response.success && response.data) {
        const convs = response.data;
        setConversations(convs);

        // Calculate stats from conversations
        const directChats = convs.filter((c) => c.type === "DIRECT").length;
        const groupChats = convs.filter((c) => c.type === "GROUP").length;
        const totalUnread = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

        setStats({
          totalMessages: convs.reduce((sum, c) => sum + (c.messageCount || 0), 0),
          activeChats: directChats,
          groupChats,
          unreadCount: totalUnread,
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load messaging data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getConversationName = (conv: Conversation): string => {
    if (conv.type === "GROUP") return conv.name || "Group";
    const otherParticipant = conv.participants?.find(
      (p) => p.userId !== localStorage.getItem("userId")
    );
    return otherParticipant?.user?.name || "Unknown";
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const statsDisplay = [
    {
      title: "Active Chats",
      value: stats.activeChats.toString(),
      change: isConnected ? "Live" : "Offline",
      icon: MessageCircle,
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Group Chats",
      value: stats.groupChats.toString(),
      change: "+",
      icon: Users,
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Unread",
      value: stats.unreadCount.toString(),
      change: stats.unreadCount > 0 ? "New" : "",
      icon: MessageSquare,
      textColor: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Total Conversations",
      value: conversations.length.toString(),
      change: "",
      icon: TrendingUp,
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header with refresh */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Messages</h1>
            {isConnected && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500 inline-block animate-pulse" />
                Live
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statsDisplay.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="border border-border shadow-sm bg-card">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-muted-foreground mb-1 text-sm font-medium">
                            {stat.title}
                          </p>
                          <h3 className="text-2xl font-bold text-foreground mb-1">{stat.value}</h3>
                          {stat.change && (
                            <Badge
                              variant="secondary"
                              className={`text-xs px-1.5 py-0 ${stat.change === "Live"
                                ? "bg-green-50 text-green-700"
                                : stat.change === "New"
                                  ? "bg-orange-50 text-orange-700"
                                  : "bg-muted"
                                }`}
                            >
                              {stat.change}
                            </Badge>
                          )}
                        </div>
                        <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                          <Icon className={`h-5 w-5 ${stat.textColor}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Chats */}
              <Card className="lg:col-span-2 border border-border shadow-sm bg-card">
                <CardHeader className="border-b border-border/50 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">Recent Conversations</CardTitle>
                      <CardDescription>Your latest messages and chats</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigate("chats")}
                      className="gap-1 text-primary hover:text-primary hover:bg-primary/5"
                    >
                      View All
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {conversations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No conversations yet</p>
                      <Button variant="link" onClick={() => onNavigate("chats")} className="mt-2">
                        Start a new chat
                      </Button>
                    </div>
                  ) : (
                    conversations.slice(0, 4).map((conv) => {
                      const name = getConversationName(conv);
                      const lastMsg = conv.lastMessage;
                      return (
                        <div
                          key={conv.id}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors border border-transparent hover:border-border/50"
                          onClick={() => onNavigate("chats")}
                        >
                          <div className="relative">
                            <Avatar className="h-12 w-12 border border-border">
                              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                {getInitials(name)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-foreground font-medium truncate">{name}</h4>
                              <span className="text-muted-foreground text-xs">
                                {lastMsg
                                  ? formatTimeAgo(new Date(lastMsg.createdAt))
                                  : formatTimeAgo(new Date(conv.createdAt))}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <Badge variant="outline" className="text-xs shrink-0 bg-muted">
                                  {conv.type === "GROUP" ? "Group" : "Direct"}
                                </Badge>
                                <p className="text-muted-foreground text-sm truncate">
                                  {lastMsg?.content || "No messages yet"}
                                </p>
                              </div>
                              {(conv.unreadCount || 0) > 0 && (
                                <Badge className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center p-0 shrink-0">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="space-y-6">
                <Card className="border border-border shadow-sm bg-card">
                  <CardHeader className="border-b border-border/50 pb-4">
                    <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                    <CardDescription>Frequently used features</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-6">
                    {quickActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full justify-start gap-3 h-auto p-4 hover:bg-muted hover:border-primary/50 transition-all group"
                          onClick={() => onNavigate(action.action as "chats" | "groups" | "contacts")}
                        >
                          <div
                            className={`${action.color.replace("600", "50")} p-2.5 rounded-lg group-hover:scale-110 transition-transform`}
                          >
                            <Icon className={`h-5 w-5 ${action.color.replace("bg-", "text-")}`} />
                          </div>
                          <div className="text-left">
                            <div className="text-foreground font-medium">{action.title}</div>
                            <div className="text-muted-foreground text-xs">{action.description}</div>
                          </div>
                        </Button>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Message Stats */}
                <Card className="border border-border shadow-sm bg-card">
                  <CardHeader className="border-b border-border/50 pb-4">
                    <CardTitle className="text-lg font-semibold">Connection Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isConnected ? "bg-green-50" : "bg-red-50"}`}>
                        <Send className={`h-4 w-4 ${isConnected ? "text-green-600" : "text-red-600"}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-muted-foreground text-sm">WebSocket</p>
                        <p className={`font-semibold ${isConnected ? "text-green-600" : "text-red-600"}`}>
                          {isConnected ? "Connected" : "Disconnected"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-50 p-2 rounded-lg">
                        <CheckCheck className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-muted-foreground text-sm">Real-time Updates</p>
                        <p className="text-foreground font-semibold">
                          {isConnected ? "Active" : "Inactive"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-50 p-2 rounded-lg">
                        <Clock className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-muted-foreground text-sm">Last Sync</p>
                        <p className="text-foreground font-semibold">Just now</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
