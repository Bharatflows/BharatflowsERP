import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Scan, Camera, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function BarcodeScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<any>(null);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setScannedProduct({
        code: "1234567890123",
        name: "Product A - Premium Quality",
        sku: "PRD-A-001",
        category: "Electronics",
        price: 2500,
        stock: 45,
        location: "Warehouse A - Rack 3",
      });
      setIsScanning(false);
      toast.success("Product scanned successfully");
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Scanner */}
      <Card>
        <CardHeader>
          <CardTitle>Scan Barcode/QR Code</CardTitle>
          <CardDescription>Scan products using camera or barcode scanner</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-8 min-h-[300px] bg-accent/50">
            {isScanning ? (
              <div className="text-center space-y-4">
                <Camera className="size-32 mx-auto text-info animate-pulse" />
                <p className="text-foreground">Scanning...</p>
                <p className="text-muted-foreground">Point camera at barcode</p>
              </div>
            ) : scannedProduct ? (
              <div className="text-center space-y-4">
                <CheckCircle className="size-32 mx-auto text-success" />
                <p className="text-foreground">Scan Complete!</p>
                <p className="text-muted-foreground">Product found</p>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <Scan className="size-32 mx-auto text-muted-foreground" />
                <p className="text-foreground">Ready to Scan</p>
                <p className="text-muted-foreground">Click button below to start</p>
              </div>
            )}
          </div>

          <Button className="w-full gap-2" onClick={handleScan} disabled={isScanning}>
            <Camera className="size-4" />
            {isScanning ? "Scanning..." : "Start Scanning"}
          </Button>
        </CardContent>
      </Card>

      {/* Product Details */}
      <Card>
        <CardHeader>
          <CardTitle>Scanned Product Details</CardTitle>
          <CardDescription>Product information from barcode scan</CardDescription>
        </CardHeader>
        <CardContent>
          {scannedProduct ? (
            <div className="space-y-4">
              <div className="p-4 bg-success-light border border-success/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="size-5 text-success" />
                  <p className="text-foreground">Product Found</p>
                </div>
                <p className="text-muted-foreground">Barcode: {scannedProduct.code}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-muted-foreground">Product Name</p>
                  <p className="text-foreground">{scannedProduct.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted-foreground">SKU</p>
                    <p className="text-foreground">{scannedProduct.sku}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <Badge variant="outline">{scannedProduct.category}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted-foreground">Price</p>
                    <p className="text-foreground">₹{scannedProduct.price.toLocaleString("en-IN")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Stock</p>
                    <p className="text-foreground text-success">{scannedProduct.stock} units</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="text-foreground">{scannedProduct.location}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => toast.success("Added to sale")}>
                  Add to Sale
                </Button>
                <Button variant="outline" onClick={() => toast.success("Stock adjusted")}>
                  Adjust Stock
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 min-h-[300px]">
              <Scan className="size-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Scan a barcode to view product details
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Scans */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
          <CardDescription>History of scanned products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { code: "1234567890123", name: "Product A", time: "Just now", action: "Stock Check" },
              { code: "9876543210987", name: "Product B", time: "5 min ago", action: "Sale" },
              { code: "5555666677778", name: "Product C", time: "10 min ago", action: "Stock Check" },
            ].map((scan, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-foreground">{scan.name}</p>
                  <p className="text-muted-foreground">{scan.code}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline">{scan.action}</Badge>
                  <p className="text-muted-foreground mt-1">{scan.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

