import { useState } from "react";
import { MessagesDashboard } from "./MessagesDashboard";
import { ChatList } from "./ChatList";
import { GroupChat } from "./GroupChat";
import { Contacts } from "./Contacts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  MessageSquare,
  MessageCircle,
  Users,
  BookUser,
} from "lucide-react";
import { ModuleHeader } from "../ui/module-header";

type Tab = "dashboard" | "chats" | "groups" | "contacts";

interface MessagesModuleProps {
  onBack?: () => void;
}

export function MessagesModule({ onBack }: MessagesModuleProps) {
  const [activeTab, setActiveTab] = useState<Tab>("chats");

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 py-4">
        <ModuleHeader
          title="Messages & Communication"
          description="Chat with your team, suppliers, and customers"
          showBackButton={true}
          backTo="/dashboard"
          icon={<MessageSquare className="size-5 text-primary" />}
          actions={
            <div className="bg-primary/10 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2 text-primary">
                <MessageSquare className="h-5 w-5" />
                <span className="text-sm font-medium">3 Unread</span>
              </div>
            </div>
          }
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="h-full flex flex-col">
          <div className="bg-card border-b border-border/50 px-6">
            <TabsList className="grid w-full grid-cols-4 gap-2 bg-muted/20 p-1 rounded-xl mb-8">
              <TabsTrigger
                value="dashboard"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="chats"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
              >
                Chats
              </TabsTrigger>
              <TabsTrigger
                value="groups"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
              >
                Groups
              </TabsTrigger>
              <TabsTrigger
                value="contacts"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
              >
                Contacts
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden bg-muted/10">
            <TabsContent value="dashboard" className="m-0 h-full">
              <MessagesDashboard onNavigate={(tab) => setActiveTab(tab)} />
            </TabsContent>

            <TabsContent value="chats" className="m-0 h-full">
              <ChatList />
            </TabsContent>

            <TabsContent value="groups" className="m-0 h-full">
              <GroupChat />
            </TabsContent>

            <TabsContent value="contacts" className="m-0 h-full">
              <Contacts />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
