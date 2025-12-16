import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { Card, CardContent } from "../ui/card";
import {
  Search,
  Plus,
  Filter,
  UserPlus,
  Mail,
  Phone,
  Building2,
  MoreVertical,
  MessageCircle,
  Star,
  Edit,
  Trash2,
  Download,
  Upload,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface Contact {
  id: number;
  name: string;
  type: "Customer" | "Supplier" | "Employee" | "Other";
  company?: string;
  email: string;
  phone: string;
  avatar: string;
  starred?: boolean;
  tags?: string[];
}

const mockContacts: Contact[] = [
  {
    id: 1,
    name: "Rajesh Kumar",
    type: "Customer",
    company: "Kumar Enterprises",
    email: "rajesh@kumar.com",
    phone: "+91 98765 43210",
    avatar: "RK",
    starred: true,
    tags: ["Premium", "Regular"],
  },
  {
    id: 2,
    name: "Priya Sharma",
    type: "Supplier",
    company: "Sharma Suppliers Ltd",
    email: "priya@sharma.com",
    phone: "+91 98765 43211",
    avatar: "PS",
    starred: true,
    tags: ["Verified"],
  },
  {
    id: 3,
    name: "Amit Patel",
    type: "Employee",
    company: "BharatFlow",
    email: "amit@bharatflow.com",
    phone: "+91 98765 43212",
    avatar: "AP",
    tags: ["Sales Team"],
  },
  {
    id: 4,
    name: "Sunita Reddy",
    type: "Customer",
    company: "Reddy Industries",
    email: "sunita@reddy.com",
    phone: "+91 98765 43213",
    avatar: "SR",
    tags: ["B2B"],
  },
  {
    id: 5,
    name: "Vikram Singh",
    type: "Supplier",
    company: "Singh Distributors",
    email: "vikram@singh.com",
    phone: "+91 98765 43214",
    avatar: "VS",
    tags: ["Verified", "Long-term"],
  },
  {
    id: 6,
    name: "Meena Iyer",
    type: "Employee",
    company: "BharatFlow",
    email: "meena@bharatflow.com",
    phone: "+91 98765 43215",
    avatar: "MI",
    tags: ["Inventory Team"],
  },
  {
    id: 7,
    name: "Deepak Gupta",
    type: "Customer",
    company: "Gupta Traders",
    email: "deepak@gupta.com",
    phone: "+91 98765 43216",
    avatar: "DG",
    tags: ["Retail"],
  },
  {
    id: 8,
    name: "Anjali Nair",
    type: "Other",
    company: "Nair Consulting",
    email: "anjali@nair.com",
    phone: "+91 98765 43217",
    avatar: "AN",
    tags: ["Consultant"],
  },
];

export function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    type: "Customer" as Contact["type"],
    company: "",
    email: "",
    phone: "",
  });

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery);
    const matchesFilter = filterType === "all" || contact.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const starredContacts = filteredContacts.filter((contact) => contact.starred);
  const regularContacts = filteredContacts.filter((contact) => !contact.starred);

  const handleAddContact = () => {
    if (!newContact.name || !newContact.email || !newContact.phone) return;

    const contact: Contact = {
      id: contacts.length + 1,
      ...newContact,
      avatar: newContact.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .substring(0, 2)
        .toUpperCase(),
    };

    setContacts([contact, ...contacts]);
    setNewContact({
      name: "",
      type: "Customer",
      company: "",
      email: "",
      phone: "",
    });
    setIsAddDialogOpen(false);
  };

  const handleToggleStar = (contactId: number) => {
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === contactId ? { ...contact, starred: !contact.starred } : contact
      )
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Customer":
        return "bg-[#2563eb]/10 text-[#2563eb] border-[#2563eb]/20";
      case "Supplier":
        return "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20";
      case "Employee":
        return "bg-[#f97316]/10 text-[#f97316] border-[#f97316]/20";
      default:
        return "bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20";
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Search and Actions Bar */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterType("all")}>
                All Contacts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("Customer")}>
                Customers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("Supplier")}>
                Suppliers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("Employee")}>
                Employees
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Export Contacts
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="h-4 w-4 mr-2" />
                Import Contacts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
                <DialogDescription>
                  Add a new contact to your address book
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    placeholder="Enter contact name"
                    value={newContact.name}
                    onChange={(e) =>
                      setNewContact({ ...newContact, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select
                    value={newContact.type}
                    onValueChange={(value) =>
                      setNewContact({ ...newContact, type: value as Contact["type"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Customer">Customer</SelectItem>
                      <SelectItem value="Supplier">Supplier</SelectItem>
                      <SelectItem value="Employee">Employee</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    placeholder="Enter company name"
                    value={newContact.company}
                    onChange={(e) =>
                      setNewContact({ ...newContact, company: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={newContact.email}
                    onChange={(e) =>
                      setNewContact({ ...newContact, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input
                    placeholder="+91 98765 43210"
                    value={newContact.phone}
                    onChange={(e) =>
                      setNewContact({ ...newContact, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddContact}
                  className="bg-primary"
                >
                  Add Contact
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={filterType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("all")}
            className={filterType === "all" ? "bg-primary" : ""}
          >
            All ({contacts.length})
          </Button>
          <Button
            variant={filterType === "Customer" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("Customer")}
            className={filterType === "Customer" ? "bg-[#2563eb]" : ""}
          >
            Customers ({contacts.filter((c) => c.type === "Customer").length})
          </Button>
          <Button
            variant={filterType === "Supplier" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("Supplier")}
            className={filterType === "Supplier" ? "bg-[#10b981]" : ""}
          >
            Suppliers ({contacts.filter((c) => c.type === "Supplier").length})
          </Button>
          <Button
            variant={filterType === "Employee" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("Employee")}
            className={filterType === "Employee" ? "bg-[#f97316]" : ""}
          >
            Employees ({contacts.filter((c) => c.type === "Employee").length})
          </Button>
        </div>
      </div>

      {/* Contacts List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Starred Contacts */}
          {starredContacts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-[#f97316] fill-[#f97316]" />
                <span className="text-muted-foreground">Starred Contacts</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {starredContacts.map((contact) => (
                  <Card key={contact.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary text-white">
                            {contact.avatar}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-foreground truncate">{contact.name}</h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleToggleStar(contact.id)}
                            >
                              <Star
                                className={`h-4 w-4 ${contact.starred
                                    ? "fill-[#f97316] text-[#f97316]"
                                    : "text-muted-foreground"
                                  }`}
                              />
                            </Button>
                          </div>

                          <Badge
                            variant="outline"
                            className={`text-xs mb-2 ${getTypeColor(contact.type)}`}
                          >
                            {contact.type}
                          </Badge>

                          {contact.company && (
                            <div className="flex items-center gap-1 mb-2">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground text-xs truncate">
                                {contact.company}
                              </span>
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground text-xs truncate">
                                {contact.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground text-xs">
                                {contact.phone}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            <Button size="sm" variant="outline" className="flex-1">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Chat
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Contact
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Contact
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Regular Contacts */}
          {regularContacts.length > 0 && (
            <div className="space-y-3">
              {starredContacts.length > 0 && (
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">All Contacts</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {regularContacts.map((contact) => (
                  <Card key={contact.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary text-white">
                            {contact.avatar}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-foreground truncate">{contact.name}</h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleToggleStar(contact.id)}
                            >
                              <Star className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>

                          <Badge
                            variant="outline"
                            className={`text-xs mb-2 ${getTypeColor(contact.type)}`}
                          >
                            {contact.type}
                          </Badge>

                          {contact.company && (
                            <div className="flex items-center gap-1 mb-2">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground text-xs truncate">
                                {contact.company}
                              </span>
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground text-xs truncate">
                                {contact.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground text-xs">
                                {contact.phone}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            <Button size="sm" variant="outline" className="flex-1">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Chat
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Contact
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Contact
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {filteredContacts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-foreground mb-2">No contacts found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Add your first contact to get started"}
              </p>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Contact
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
