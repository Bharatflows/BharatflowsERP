import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  FileText,
  File,
  Image as ImageIcon,
  Download,
  Share2,
  Trash2,
  Search,
  MoreVertical,
  Eye,
  FolderOpen,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  size: string;
  uploadedBy: string;
  uploadDate: string;
  expiryDate?: string;
  shared: boolean;
}

export function DocumentLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "1",
      name: "GST Registration Certificate",
      type: "PDF",
      category: "GST",
      size: "2.3 MB",
      uploadedBy: "Admin",
      uploadDate: "2024-09-15",
      expiryDate: "2025-09-15",
      shared: false,
    },
    {
      id: "2",
      name: "Company Registration",
      type: "PDF",
      category: "Legal",
      size: "1.8 MB",
      uploadedBy: "Admin",
      uploadDate: "2024-08-20",
      shared: true,
    },
    {
      id: "3",
      name: "Tax Audit Report 2023-24",
      type: "PDF",
      category: "Finance",
      size: "4.5 MB",
      uploadedBy: "Accountant",
      uploadDate: "2024-07-10",
      shared: false,
    },
    {
      id: "4",
      name: "Purchase Agreement - ABC Corp",
      type: "DOCX",
      category: "Contracts",
      size: "856 KB",
      uploadedBy: "Admin",
      uploadDate: "2024-09-05",
      expiryDate: "2025-09-05",
      shared: true,
    },
    {
      id: "5",
      name: "Product Catalog 2024",
      type: "PDF",
      category: "Marketing",
      size: "15.2 MB",
      uploadedBy: "Marketing",
      uploadDate: "2024-06-01",
      shared: true,
    },
    {
      id: "6",
      name: "Insurance Policy",
      type: "PDF",
      category: "Legal",
      size: "980 KB",
      uploadedBy: "Admin",
      uploadDate: "2024-05-15",
      expiryDate: "2025-05-15",
      shared: false,
    },
  ]);

  const categories = ["all", "GST", "Legal", "Finance", "Contracts", "Marketing", "HR"];

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (type: string) => {
    if (type === "PDF") return <FileText className="size-8 text-[#ef4444]" />;
    if (type === "DOCX") return <File className="size-8 text-[#2563eb]" />;
    if (type === "XLSX") return <File className="size-8 text-[#10b981]" />;
    if (["JPG", "PNG"].includes(type)) return <ImageIcon className="size-8 text-[#f97316]" />;
    return <File className="size-8 text-muted-foreground" />;
  };

  const deleteDocument = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id));
    toast.success("Document deleted");
  };

  // Check if expiring soon (within 30 days)
  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry <= thirtyDaysFromNow && expiry >= today;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Total Documents</p>
              <p className="text-foreground">{documents.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Shared</p>
              <p className="text-foreground">
                {documents.filter((d) => d.shared).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Categories</p>
              <p className="text-foreground">{categories.length - 1}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Expiring Soon</p>
              <p className="text-foreground text-[#f97316]">
                {documents.filter((d) => isExpiringSoon(d.expiryDate)).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Library */}
      <Card>
        <CardHeader>
          <CardTitle>Document Library</CardTitle>
          <CardDescription>All your business documents in one place</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  {getFileIcon(doc.type)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="size-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="size-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="size-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteDocument(doc.id)}
                      >
                        <Trash2 className="size-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="text-foreground mb-2 line-clamp-2">{doc.name}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{doc.category}</Badge>
                    <Badge variant="outline">{doc.type}</Badge>
                    {doc.shared && <Badge className="bg-[#10b981] text-white">Shared</Badge>}
                  </div>

                  {isExpiringSoon(doc.expiryDate) && (
                    <Badge className="bg-[#f97316] text-white w-full justify-center">
                      <Calendar className="size-3 mr-1" />
                      Expiring Soon
                    </Badge>
                  )}

                  <div className="flex items-center justify-between text-muted-foreground pt-2">
                    <span>{doc.size}</span>
                    <span>
                      {new Date(doc.uploadDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12 border rounded-lg">
              <FolderOpen className="size-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-foreground mb-2">No documents found</p>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

