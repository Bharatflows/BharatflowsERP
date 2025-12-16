import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Search } from "lucide-react";

export function ProductLookup() {
  const [searchTerm, setSearchTerm] = useState("");

  const products = [
    { code: "1234567890123", name: "Product A", sku: "PRD-A-001", stock: 45, price: 2500 },
    { code: "9876543210987", name: "Product B", sku: "PRD-B-002", stock: 32, price: 1800 },
    { code: "5555666677778", name: "Product C", sku: "PRD-C-003", stock: 18, price: 3200 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Lookup by Barcode</CardTitle>
        <CardDescription>Search products using barcode numbers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              placeholder="Enter barcode number..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {products.map((product, idx) => (
              <div key={idx} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-foreground">{product.name}</p>
                  <Badge className={product.stock > 20 ? "bg-[#10b981] text-white" : "bg-[#f97316] text-white"}>
                    {product.stock} in stock
                  </Badge>
                </div>
                <p className="text-muted-foreground">Barcode: {product.code}</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU: {product.sku}</span>
                  <span className="text-foreground">₹{product.price.toLocaleString("en-IN")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
