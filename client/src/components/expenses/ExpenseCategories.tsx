import { useState, useEffect } from "react";
import { expenseCategoriesService } from "../../services/modules.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Plus, Edit, Trash2, Folder } from "lucide-react";
import { toast } from "sonner";
import { chartColors } from "@/lib/chartColors";

interface Category {
  id: string;
  name: string;
  description?: string;
  budget: number;
  spent: number;
  count: number;
  color: string;
  maxAmount?: number;
}

export function ExpenseCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState<{ name: string, description: string, budget: string, color: string, maxAmount: string }>({
    name: "",
    description: "",
    budget: "",
    color: chartColors.brand,
    maxAmount: "",
  });
  const [editFormData, setEditFormData] = useState<{ name: string, description: string, budget: string, color: string, maxAmount: string }>({
    name: "",
    description: "",
    budget: "",
    color: chartColors.brand,
    maxAmount: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await expenseCategoriesService.getAll();
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name) {
      toast.error("Please enter category name");
      return;
    }

    try {
      const response = await expenseCategoriesService.create({
        name: newCategory.name,
        description: newCategory.description,
        budget: newCategory.budget ? parseFloat(newCategory.budget) : 0,
        color: newCategory.color,
        maxAmount: newCategory.maxAmount ? parseFloat(newCategory.maxAmount) : undefined,
      });

      if (response.success && response.data) {
        setCategories([...categories, response.data]);
        setIsAddOpen(false);
        setNewCategory({ name: "", description: "", budget: "", color: chartColors.brand, maxAmount: "" });
        toast.success("Category added successfully");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to add category");
    }
  };

  const handleDelete = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category && category.count > 0) {
      toast.error(`Cannot delete: ${category.count} expense(s) linked to this category`);
      return;
    }
    try {
      const response = await expenseCategoriesService.delete(categoryId);
      if (response.success) {
        setCategories(categories.filter((c) => c.id !== categoryId));
        toast.success("Category deleted");
      }
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setEditFormData({
      name: category.name,
      description: category.description || "",
      budget: String(category.budget || ""),
      color: category.color || chartColors.brand,
      maxAmount: category.maxAmount ? String(category.maxAmount) : "",
    });
    setIsEditOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editFormData.name) {
      toast.error("Please enter category name");
      return;
    }
    try {
      const response = await expenseCategoriesService.update(editingCategory.id, {
        name: editFormData.name,
        description: editFormData.description,
        budget: editFormData.budget ? parseFloat(editFormData.budget) : 0,
        color: editFormData.color,
        maxAmount: editFormData.maxAmount ? parseFloat(editFormData.maxAmount) : undefined,
      });
      if (response.success) {
        setCategories(categories.map(c =>
          c.id === editingCategory.id ? { ...c, ...response.data } : c
        ));
        setIsEditOpen(false);
        setEditingCategory(null);
        toast.success("Category updated successfully");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update category");
    }
  };

  const getBudgetUtilization = (spent: number, budget?: number) => {
    if (!budget) return 0;
    return (spent / budget) * 100;
  };

  const totalBudget = categories.reduce((sum, cat) => sum + (cat.budget || 0), 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Budget</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">₹{totalBudget.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Spent</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">₹{totalSpent.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Budget Utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">
              {((totalSpent / totalBudget) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Expense Categories</CardTitle>
              <CardDescription>
                Manage categories and monthly budgets
              </CardDescription>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="size-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                  <DialogDescription>
                    Create a new expense category
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="catName">Category Name *</Label>
                    <Input
                      id="catName"
                      placeholder="e.g., Equipment"
                      value={newCategory.name}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="catDesc">Description</Label>
                    <Input
                      id="catDesc"
                      placeholder="Brief description"
                      value={newCategory.description}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="catBudget">Monthly Budget</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-muted-foreground">₹</span>
                      <Input
                        id="catBudget"
                        type="number"
                        placeholder="0.00"
                        className="pl-7"
                        value={newCategory.budget}
                        onChange={(e) =>
                          setNewCategory({ ...newCategory, budget: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="catMaxAmount">Max Amount per Expense</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-muted-foreground">₹</span>
                      <Input
                        id="catMaxAmount"
                        type="number"
                        placeholder="Leave empty for no limit"
                        className="pl-7"
                        value={newCategory.maxAmount}
                        onChange={(e) =>
                          setNewCategory({ ...newCategory, maxAmount: e.target.value })
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Expenses exceeding this amount will be flagged for review
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="catColor">Color</Label>
                    <Input
                      id="catColor"
                      type="color"
                      value={newCategory.color}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, color: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCategory}>Add Category</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="hidden md:table-cell">Expenses</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => {
                  const utilization = getBudgetUtilization(
                    category.spent,
                    category.budget
                  );
                  return (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="size-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <div>
                            <p className="text-foreground">{category.name}</p>
                            <p className="text-muted-foreground md:hidden">
                              {category.count} expenses
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.description}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{category.count}</Badge>
                      </TableCell>
                      <TableCell>
                        {category.budget
                          ? `₹${category.budget.toLocaleString("en-IN")}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        ₹{category.spent.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-accent rounded-full h-2 overflow-hidden max-w-[100px]">
                            <div
                              className={`h-full ${utilization > 100
                                ? "bg-error"
                                : utilization > 80
                                  ? "bg-warning"
                                  : "bg-success"
                                }`}
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            />
                          </div>
                          <span className="text-muted-foreground">
                            {utilization.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(category)}>
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Category Cards View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const utilization = getBudgetUtilization(category.spent, category.budget);
          return (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Folder
                        className="size-5"
                        style={{ color: category.color }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-base">{category.name}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="text-foreground">
                    {category.budget
                      ? `₹${category.budget.toLocaleString("en-IN")}`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Spent:</span>
                  <span className="text-foreground">
                    ₹{category.spent.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expenses:</span>
                  <Badge variant="outline">{category.count}</Badge>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Utilization:</span>
                    <span
                      className={
                        utilization > 100
                          ? "text-error"
                          : utilization > 80
                            ? "text-warning"
                            : "text-success"
                      }
                    >
                      {utilization.toFixed(0)}%
                    </span>
                  </div>
                  <div className="bg-accent rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${utilization > 100
                        ? "bg-error"
                        : utilization > 80
                          ? "bg-warning"
                          : "bg-success"
                        }`}
                      style={{ width: `${Math.min(utilization, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category details and budget</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Category Name *</Label>
              <Input
                id="editName"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDesc">Description</Label>
              <Input
                id="editDesc"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editBudget">Monthly Budget</Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-muted-foreground">₹</span>
                <Input
                  id="editBudget"
                  type="number"
                  placeholder="0.00"
                  className="pl-7"
                  value={editFormData.budget}
                  onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editMaxAmount">Max Amount per Expense</Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-muted-foreground">₹</span>
                <Input
                  id="editMaxAmount"
                  type="number"
                  placeholder="Leave empty for no limit"
                  className="pl-7"
                  value={editFormData.maxAmount}
                  onChange={(e) => setEditFormData({ ...editFormData, maxAmount: e.target.value })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Expenses exceeding this amount will be flagged
              </p>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {[chartColors.brand, chartColors.success, chartColors.orange, chartColors.purple, chartColors.pink, chartColors.axis].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full ${editFormData.color === color ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditFormData({ ...editFormData, color })}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleUpdateCategory} className="w-full">
              Update Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

