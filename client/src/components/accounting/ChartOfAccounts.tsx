import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
    ChevronRight,
    ChevronDown,
    Plus,
    RefreshCw,
    Loader2,
    Book,
    TrendingUp,
    TrendingDown,
    Search,
    ArrowUpDown,
    ArrowLeft,
    Eye,
} from "lucide-react";
import { accountingService } from "@/services/modules.service";
import { toast } from "sonner";

interface LedgerGroup {
    id: string;
    name: string;
    code: string;
    type: string;
    children: LedgerGroup[];
    ledgers: { id: string; name: string; code: string }[];
}

interface Ledger {
    id: string;
    name: string;
    code: string;
    group: { id: string; name: string; type: string };
}

export function ChartOfAccounts() {
    const [groups, setGroups] = useState<LedgerGroup[]>([]);
    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [seeding, setSeeding] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [groupsRes, ledgersRes] = await Promise.all([
                accountingService.getLedgerGroups(),
                accountingService.getLedgers(),
            ]);

            if (groupsRes.success) setGroups(groupsRes.data || []);
            if (ledgersRes.success) setLedgers(ledgersRes.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch Chart of Accounts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSeedDefaults = async () => {
        setSeeding(true);
        try {
            await accountingService.seedDefaults();
            toast.success("Default Chart of Accounts created!");
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to seed defaults");
        } finally {
            setSeeding(false);
        }
    };

    const toggleGroup = (groupId: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupId)) {
            newExpanded.delete(groupId);
        } else {
            newExpanded.add(groupId);
        }
        setExpandedGroups(newExpanded);
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "ASSET":
                return "text-blue-600 bg-blue-50";
            case "LIABILITY":
                return "text-red-600 bg-red-50";
            case "EQUITY":
                return "text-purple-600 bg-purple-50";
            case "INCOME":
                return "text-green-600 bg-green-50";
            case "EXPENSE":
                return "text-orange-600 bg-orange-50";
            default:
                return "text-gray-600 bg-gray-50";
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "ASSET":
            case "INCOME":
                return <TrendingUp className="h-3 w-3" />;
            case "LIABILITY":
            case "EXPENSE":
                return <TrendingDown className="h-3 w-3" />;
            default:
                return <Book className="h-3 w-3" />;
        }
    };

    // Build tree structure from flat groups
    const buildTree = (groups: LedgerGroup[]): LedgerGroup[] => {
        const lookup: Record<string, LedgerGroup & { children: LedgerGroup[] }> = {};
        const tree: LedgerGroup[] = [];

        // Create lookup and add children array
        groups.forEach((g) => {
            lookup[g.id] = { ...g, children: [] };
        });

        // Build tree
        groups.forEach((g) => {
            const parentId = (g as any).parentId;
            if (parentId && lookup[parentId]) {
                lookup[parentId].children.push(lookup[g.id]);
            } else {
                tree.push(lookup[g.id]);
            }
        });

        return tree;
    };

    const renderGroup = (group: LedgerGroup, depth: number = 0) => {
        const isExpanded = expandedGroups.has(group.id);
        const hasChildren = group.children?.length > 0 || group.ledgers?.length > 0;
        const groupLedgers = ledgers.filter((l) => l.group.id === group.id);

        if (
            searchQuery &&
            !group.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !groupLedgers.some((l) =>
                l.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        ) {
            return null;
        }

        return (
            <div key={group.id}>
                <div
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors`}
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                    onClick={() => toggleGroup(group.id)}
                >
                    <div className="w-5 h-5 flex items-center justify-center">
                        {hasChildren ? (
                            isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )
                        ) : (
                            <div className="w-4" />
                        )}
                    </div>
                    <Badge className={`text-xs ${getTypeColor(group.type)}`} variant="secondary">
                        {getTypeIcon(group.type)}
                        <span className="ml-1">{group.type}</span>
                    </Badge>
                    <span className="font-medium flex-1">{group.name}</span>
                    <span className="text-xs text-muted-foreground">{group.code}</span>
                </div>

                {isExpanded && (
                    <div>
                        {/* Render child groups */}
                        {group.children?.map((child) => renderGroup(child, depth + 1))}

                        {/* Render ledgers in this group */}
                        {groupLedgers.map((ledger) => (
                            <Link
                                key={ledger.id}
                                to={`/accounting/ledger/${ledger.id}`}
                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors group"
                                style={{ paddingLeft: `${(depth + 1) * 16 + 28}px` }}
                            >
                                <Book className="h-4 w-4 text-muted-foreground" />
                                <span className="flex-1 group-hover:text-primary">{ledger.name}</span>
                                <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="text-xs text-muted-foreground font-mono">
                                    {ledger.code}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const treeData = buildTree(groups);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading Chart of Accounts...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/accounting">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Chart of Accounts</h1>
                        <p className="text-muted-foreground">
                            Manage your ledger accounts and groups
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    {groups.length === 0 && (
                        <Button onClick={handleSeedDefaults} disabled={seeding}>
                            {seeding ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4 mr-2" />
                            )}
                            Create Default Chart
                        </Button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"].map((type) => {
                    const count = ledgers.filter((l) => l.group.type === type).length;
                    return (
                        <Card key={type}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <Badge className={`text-xs ${getTypeColor(type)}`} variant="secondary">
                                        {getTypeIcon(type)}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">{type}</span>
                                </div>
                                <p className="text-2xl font-bold mt-1">{count}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search accounts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Accounts Tree */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ArrowUpDown className="h-5 w-5" />
                        Ledger Accounts
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {treeData.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Book className="h-12 w-12 mx-auto mb-4" />
                            <p>No ledger accounts found</p>
                            <Button variant="link" onClick={handleSeedDefaults} disabled={seeding}>
                                Create default Chart of Accounts
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-1">{treeData.map((g) => renderGroup(g))}</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default ChartOfAccounts;
