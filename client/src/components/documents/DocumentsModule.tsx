import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { DocumentLibrary } from "./DocumentLibrary";
import { DocumentUpload } from "./DocumentUpload";
import { DocumentCategories } from "./DocumentCategories";
import { DocumentSharing } from "./DocumentSharing";
import { ModuleHeader } from "../ui/module-header";
import { FileText } from "lucide-react";

export function DocumentsModule() {
  const [activeTab, setActiveTab] = useState("library");

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="p-4 md:p-6">
        <ModuleHeader
          title="Document Management System"
          description="Organize, store, and manage all your business documents"
          showBackButton={true}
          backTo="/dashboard"
          icon={<FileText className="size-5 text-primary" />}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="library">Document Library</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="sharing">Sharing</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="library" className="mt-6">
            <DocumentLibrary />
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <DocumentUpload />
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <DocumentCategories />
          </TabsContent>

          <TabsContent value="sharing" className="mt-6">
            <DocumentSharing />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
