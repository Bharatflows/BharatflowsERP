import { useState, useEffect } from "react";
import { ChatView } from "./ChatView";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import {
  Search,
  Plus,
  Filter,
  MessageCircle,
  Pin,
  Archive,
  MoreVertical,
  Star,
  Loader2,
  RefreshCw,
  Users,
  User,
  Building2,
  Truck,
  Mail,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "sonner";
import { messagingService, Conversation } from "../../services/messagingService";
import { useSocket } from "../../hooks/useSocket";
import api from "../../services/api";

interface ChatDisplay {
  id: string;
  name: string;
  type: "Direct" | "Group";
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  avatar: string;
  pinned?: boolean;
  starred?: boolean;
  partyType?: "Customer" | "Supplier";
}

interface Party {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  gstin?: string;
  type: "CUSTOMER" | "SUPPLIER";
}

export function ChatList() {
  const [selectedChat, setSelectedChat] = useState<ChatDisplay | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatTab, setNewChatTab] = useState<"customers" | "suppliers" | "group">("customers");
  const [newGroupName, setNewGroupName] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [customers, setCustomers] = useState<Party[]>([]);
  const [suppliers, setSuppliers] = useState<Party[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);

  const { isConnected, onNewMessage } = useSocket();

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await messagingService.getConversations();
      if (response.data) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  // Fetch customers and suppliers when dialog opens
  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      const [customersRes, suppliersRes] = await Promise.all([
        api.get<{ success: boolean; data: Party[] }>("/parties?type=CUSTOMER&limit=100"),
        api.get<{ success: boolean; data: Party[] }>("/parties?type=SUPPLIER&limit=100"),
      ]);

      const customersData = customersRes?.data || [];
      const suppliersData = suppliersRes?.data || [];

      if (customersData.length > 0) {
        setCustomers(customersData.map((p) => ({ ...p, type: "CUSTOMER" as const })));
      }
      if (suppliersData.length > 0) {
        setSuppliers(suppliersData.map((p) => ({ ...p, type: "SUPPLIER" as const })));
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
      toast.error("Failed to load contacts");
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (isNewChatOpen) {
      fetchContacts();
    }
  }, [isNewChatOpen]);

  // Listen for new messages
  useEffect(() => {
    const cleanup = onNewMessage((message) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === message.conversationId
            ? {
              ...conv,
              lastMessage: message as any,
              unreadCount: (conv.unreadCount || 0) + 1,
              updatedAt: new Date().toISOString(),
            }
            : conv
        )
      );
    });
    return cleanup;
  }, [onNewMessage]);

  // Transform conversation to display format
  const transformToDisplay = (conv: Conversation): ChatDisplay => {
    const userParticipant = conv.participants?.find(
      (p) => p.user && p.userId !== localStorage.getItem("userId")
    );
    const partyParticipant = conv.participants?.find((p) => p.party);

    let name = conv.name || "Unknown";
    let avatar = "??";
    let partyType: "Customer" | "Supplier" | undefined;

    if (conv.type === "DIRECT") {
      if (partyParticipant?.party) {
        name = partyParticipant.party.name;
        partyType = partyParticipant.party.type === "CUSTOMER" ? "Customer" : "Supplier";
      } else if (userParticipant?.user) {
        name = userParticipant.user.name;
      }
      avatar = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    } else if (conv.type === "GROUP") {
      avatar = (conv.name || "G")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }

    const lastMsg = conv.lastMessage;
    const lastMessageText = lastMsg
      ? `${lastMsg.sender?.name?.split(" ")[0] || "You"}: ${lastMsg.content?.slice(0, 30)}${lastMsg.content?.length > 30 ? "..." : ""}`
      : "No messages yet";

    const timeAgo = lastMsg
      ? formatTimeAgo(new Date(lastMsg.createdAt))
      : formatTimeAgo(new Date(conv.createdAt));

    return {
      id: conv.id,
      name,
      type: conv.type === "DIRECT" ? "Direct" : "Group",
      lastMessage: lastMessageText,
      time: timeAgo,
      unread: conv.unreadCount || 0,
      online: false,
      avatar,
      partyType,
    };
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  // Invite party
  const handleInvite = async (party: Party, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!party.email) {
        toast.error("Contact has no email address");
        return;
      }

      const promise = messagingService.inviteParty({
        partyId: party.id,
        email: party.email,
        message: "Join me on BharatFlow for secure messaging."
      });

      toast.promise(promise, {
        loading: 'Sending invitation...',
        success: `Invitation sent to ${party.name}`,
        error: 'Failed to send invitation'
      });
    } catch (error) {
      console.error("Failed to invite:", error);
    }
  };

  // Start chat with a party (customer/supplier)
  const startChatWithParty = async (party: Party) => {
    try {
      setCreatingChat(true);

      // Check if conversation already exists
      const existingConv = conversations.find((c) =>
        c.participants?.some((p) => p.partyId === party.id)
      );

      if (existingConv) {
        setIsNewChatOpen(false);
        setSelectedChat(transformToDisplay(existingConv));
        return;
      }

      // Create new conversation with party
      const response = await messagingService.createConversation({
        type: "DIRECT",
        name: party.name,
        participantPartyIds: [party.id],
      });

      if (response.data) {
        toast.success(`Chat started with ${party.name}`);
        setIsNewChatOpen(false);
        await fetchConversations();
        setSelectedChat(transformToDisplay(response.data));
      }
    } catch (error) {
      console.error("Failed to start chat:", error);
      toast.error("Failed to start chat");
    } finally {
      setCreatingChat(false);
    }
  };

  // Create group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      setCreatingChat(true);
      const response = await messagingService.createConversation({
        type: "GROUP",
        name: newGroupName,
      });

      if (response.data) {
        toast.success("Group created");
        setIsNewChatOpen(false);
        setNewGroupName("");
        fetchConversations();
      }
    } catch (error) {
      toast.error("Failed to create group");
    } finally {
      setCreatingChat(false);
    }
  };

  const displayChats = conversations.map(transformToDisplay);

  const filteredChats = displayChats.filter((chat) => {
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterType === "all" ||
      (filterType === "Direct" && chat.type === "Direct") ||
      (filterType === "Group" && chat.type === "Group") ||
      (filterType === "Customer" && chat.partyType === "Customer") ||
      (filterType === "Supplier" && chat.partyType === "Supplier");
    return matchesSearch && matchesFilter;
  });

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase())
  );
  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const getTypeColor = (type: string, partyType?: string) => {
    if (partyType === "Customer") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (partyType === "Supplier") return "bg-orange-50 text-orange-700 border-orange-200";
    if (type === "Group") return "bg-purple-50 text-purple-700 border-purple-200";
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  if (selectedChat) {
    return (
      <ChatView
        chat={{
          id: selectedChat.id,
          name: selectedChat.name,
          type: selectedChat.type,
          avatar: selectedChat.avatar,
          online: selectedChat.online,
        }}
        onBack={() => {
          setSelectedChat(null);
          fetchConversations();
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border/50 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-foreground">Chats</h2>
            {isConnected && (
              <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                Live
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchConversations} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button size="icon" onClick={() => setIsNewChatOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterType("all")}>All Chats</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("Customer")}>Customers</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("Supplier")}>Suppliers</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("Group")}>Groups</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={filterType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("all")}
          >
            All
          </Button>
          <Button
            variant={filterType === "Customer" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("Customer")}
            className={filterType === "Customer" ? "bg-emerald-600" : ""}
          >
            <Building2 className="h-3 w-3 mr-1" />
            Customers
          </Button>
          <Button
            variant={filterType === "Supplier" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("Supplier")}
            className={filterType === "Supplier" ? "bg-orange-600" : ""}
          >
            <Truck className="h-3 w-3 mr-1" />
            Suppliers
          </Button>
          <Button
            variant={filterType === "Group" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("Group")}
            className={filterType === "Group" ? "bg-purple-600" : ""}
          >
            <Users className="h-3 w-3 mr-1" />
            Groups
          </Button>
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                getTypeColor={getTypeColor}
                onClick={() => setSelectedChat(chat)}
              />
            ))}

            {filteredChats.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-foreground mb-2 font-medium">No chats found</h3>
                <p className="text-muted-foreground text-center text-sm mb-4">
                  {searchQuery
                    ? "Try adjusting your search"
                    : "Start a chat with a customer or supplier"}
                </p>
                <Button onClick={() => setIsNewChatOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* New Chat Dialog */}
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
          </DialogHeader>

          <Tabs value={newChatTab} onValueChange={(v) => setNewChatTab(v as typeof newChatTab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="customers" className="gap-1">
                <Building2 className="h-4 w-4" />
                Customers
              </TabsTrigger>
              <TabsTrigger value="suppliers" className="gap-1">
                <Truck className="h-4 w-4" />
                Suppliers
              </TabsTrigger>
              <TabsTrigger value="group" className="gap-1">
                <Users className="h-4 w-4" />
                Group
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              {newChatTab !== "group" && (
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${newChatTab}...`}
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}

              <TabsContent value="customers" className="mt-0">
                <ScrollArea className="h-64">
                  {loadingContacts ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : filteredCustomers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No customers found</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredCustomers.map((customer) => (
                        <ContactItem
                          key={customer.id}
                          contact={customer}
                          onClick={() => startChatWithParty(customer)}
                          onInvite={(e) => handleInvite(customer, e)}
                          disabled={creatingChat}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="suppliers" className="mt-0">
                <ScrollArea className="h-64">
                  {loadingContacts ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : filteredSuppliers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No suppliers found</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredSuppliers.map((supplier) => (
                        <ContactItem
                          key={supplier.id}
                          contact={supplier}
                          onClick={() => startChatWithParty(supplier)}
                          onInvite={(e) => handleInvite(supplier, e)}
                          disabled={creatingChat}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="group" className="mt-0">
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Group Name</Label>
                    <Input
                      placeholder="Enter group name..."
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNewChatOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateGroup} disabled={creatingChat || !newGroupName.trim()}>
                      {creatingChat ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Create Group
                    </Button>
                  </DialogFooter>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Contact Item Component
function ContactItem({
  contact,
  onClick,
  onInvite,
  disabled,
}: {
  contact: Party;
  onClick: () => void;
  onInvite: (e: React.MouseEvent) => void;
  disabled: boolean;
}) {
  const initials = contact.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors ${disabled ? "opacity-50 pointer-events-none" : ""
        }`}
      onClick={onClick}
    >
      <Avatar className="h-10 w-10">
        <AvatarFallback
          className={`${contact.type === "CUSTOMER"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-orange-100 text-orange-700"
            }`}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{contact.name}</p>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs ${contact.type === "CUSTOMER"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-orange-50 text-orange-700 border-orange-200"
              }`}
          >
            {contact.type === "CUSTOMER" ? "Customer" : "Supplier"}
          </Badge>
          {contact.phone && (
            <span className="text-xs text-muted-foreground truncate">{contact.phone}</span>
          )}
        </div>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={onInvite} title="Invite to Chat">
        <Mail className="h-4 w-4" />
      </Button>
      <MessageCircle className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

// Chat Item Component
function ChatItem({
  chat,
  getTypeColor,
  onClick,
}: {
  chat: ChatDisplay;
  getTypeColor: (type: string, partyType?: string) => string;
  onClick: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 p-4 hover:bg-muted cursor-pointer transition-colors group border-l-2 border-transparent hover:border-primary"
      onClick={onClick}
    >
      <div className="relative">
        <Avatar className="h-12 w-12 border border-border">
          <AvatarFallback
            className={`font-medium ${chat.partyType === "Customer"
              ? "bg-emerald-100 text-emerald-700"
              : chat.partyType === "Supplier"
                ? "bg-orange-100 text-orange-700"
                : chat.type === "Group"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-primary/10 text-primary"
              }`}
          >
            {chat.avatar}
          </AvatarFallback>
        </Avatar>
        {chat.online && (
          <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-background rounded-full" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h4 className="text-foreground font-medium truncate">{chat.name}</h4>
            {chat.starred && <Star className="h-3 w-3 fill-amber-500 text-amber-500" />}
          </div>
          <span className="text-muted-foreground text-xs">{chat.time}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Badge
              variant="outline"
              className={`text-xs ${getTypeColor(chat.type, chat.partyType)}`}
            >
              {chat.partyType || chat.type}
            </Badge>
            <p className="text-muted-foreground text-sm truncate">{chat.lastMessage}</p>
          </div>
          {chat.unread > 0 && (
            <Badge className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center p-0 ml-2 shrink-0">
              {chat.unread}
            </Badge>
          )}
        </div>
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
            <DropdownMenuItem>
              <Pin className="h-4 w-4 mr-2" />
              Pin Chat
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Star className="h-4 w-4 mr-2" />
              Star Chat
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Archive className="h-4 w-4 mr-2" />
              Archive Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
