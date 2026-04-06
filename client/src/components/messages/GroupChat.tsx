import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { Card, CardContent } from "../ui/card";
import {
  Search,
  Plus,
  Users,
  MoreVertical,
  UserPlus,
  Settings,
  Bell,
  Archive,
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { messagingService, Conversation } from "../../services/messagingService";

interface GroupDisplay {
  id: string;
  name: string;
  description: string;
  members: number;
  unread: number;
  lastMessage: string;
  time: string;
  avatar: string;
  color: string;
  admin: boolean;
}

export function GroupChat() {
  const [groups, setGroups] = useState<GroupDisplay[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-orange-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-cyan-500",
  ];

  // Fetch group conversations
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response: any = await messagingService.getConversations({ type: "GROUP" });
      if (response.data?.data || response.data) {
        const groupConversations = response.data?.data || response.data || response;
        const displayGroups = groupConversations.map((conv: any, index: number) =>
          transformToGroup(conv, index)
        );
        setGroups(displayGroups);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const transformToGroup = (conv: Conversation, index: number): GroupDisplay => {
    const lastMsg = conv.lastMessage;
    const lastMessageText = lastMsg
      ? `${lastMsg.sender?.name?.split(" ")[0] || "Unknown"}: ${lastMsg.content?.slice(0, 30)}...`
      : "No messages yet";

    const timeAgo = lastMsg
      ? formatTimeAgo(new Date(lastMsg.createdAt))
      : formatTimeAgo(new Date(conv.createdAt));

    const currentUserId = localStorage.getItem("userId");
    const isAdmin = conv.participants?.some(
      (p) => p.userId === currentUserId && p.role === "ADMIN"
    );

    return {
      id: conv.id,
      name: conv.name || "Unnamed Group",
      description: conv.description || "No description",
      members: conv.participants?.length || 0,
      unread: conv.unreadCount || 0,
      lastMessage: lastMessageText,
      time: timeAgo,
      avatar: (conv.name || "G")
        .split(" ")
        .map((word) => word[0])
        .join("")
        .substring(0, 2)
        .toUpperCase(),
      color: colors[index % colors.length],
      admin: isAdmin || false,
    };
  };

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

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      setCreating(true);
      const response: any = await messagingService.createConversation({
        type: "GROUP",
        name: newGroupName,
        description: newGroupDescription,
      });

      if (response.data?.data || response.data) {
        toast.success("Group created successfully");
        setNewGroupName("");
        setNewGroupDescription("");
        setIsCreateDialogOpen(false);
        fetchGroups();
      }
    } catch (error) {
      console.error("Failed to create group:", error);
      toast.error("Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await messagingService.deleteConversation(groupId);
      toast.success("Group deleted");
      fetchGroups();
    } catch (error) {
      toast.error("Failed to delete group");
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    const currentUserId = localStorage.getItem("userId");
    if (!currentUserId) return;

    try {
      await messagingService.removeParticipant(groupId, currentUserId);
      toast.success("Left the group");
      fetchGroups();
    } catch (error) {
      toast.error("Failed to leave group");
    }
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Search and Actions Bar */}
      <div className="p-4 border-b border-border/50 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button variant="ghost" size="icon" onClick={fetchGroups} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Create a group chat to collaborate with your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Group Name</Label>
                  <Input
                    placeholder="Enter group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Enter group description"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateGroup} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Group"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Group List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Admin Groups */}
            {filteredGroups.filter((g) => g.admin).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground text-sm font-medium">
                    Groups You Admin
                  </span>
                </div>
                {filteredGroups
                  .filter((group) => group.admin)
                  .map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      isAdmin={true}
                      onDelete={() => handleDeleteGroup(group.id)}
                    />
                  ))}
              </div>
            )}

            {/* Other Groups */}
            {filteredGroups.filter((g) => !g.admin).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground text-sm font-medium">All Groups</span>
                </div>
                {filteredGroups
                  .filter((group) => !group.admin)
                  .map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      isAdmin={false}
                      onLeave={() => handleLeaveGroup(group.id)}
                    />
                  ))}
              </div>
            )}

            {filteredGroups.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-foreground font-medium mb-2">No groups found</h3>
                <p className="text-muted-foreground text-center mb-4 text-sm">
                  {searchQuery
                    ? "Try adjusting your search"
                    : "Create a group to start collaborating with your team"}
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Group
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// Group Card Component
function GroupCard({
  group,
  isAdmin,
  onDelete,
  onLeave,
}: {
  group: GroupDisplay;
  isAdmin: boolean;
  onDelete?: () => void;
  onLeave?: () => void;
}) {
  return (
    <Card className="border border-border hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className={`${group.color} text-white`}>
              {group.avatar}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h4 className="text-foreground font-medium">{group.name}</h4>
                {isAdmin && (
                  <Badge variant="secondary" className="text-xs">
                    Admin
                  </Badge>
                )}
              </div>
              <span className="text-muted-foreground text-xs">{group.time}</span>
            </div>
            <p className="text-muted-foreground text-sm mb-2 line-clamp-1">
              {group.description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs">
                    {group.members} members
                  </span>
                </div>
                <p className="text-muted-foreground text-xs truncate">
                  {group.lastMessage}
                </p>
              </div>
              {group.unread > 0 && (
                <Badge className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center p-0">
                  {group.unread}
                </Badge>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAdmin && (
                <>
                  <DropdownMenuItem>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Members
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Group Settings
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem>
                <Bell className="h-4 w-4 mr-2" />
                Mute Notifications
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Archive className="h-4 w-4 mr-2" />
                Archive Group
              </DropdownMenuItem>
              {isAdmin ? (
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Group
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="text-destructive" onClick={onLeave}>
                  Exit Group
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
