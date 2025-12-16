import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Barcode, QrCode, Download, Printer } from "lucide-react";
import { toast } from "sonner";

export function BarcodeGenerator() {
  const [barcodeType, setBarcodeType] = useState("ean13");
  const [barcodeData, setBarcodeData] = useState("");
  const [productName, setProductName] = useState("");

  const handleGenerate = () => {
    if (!barcodeData) {
      toast.error("Please enter barcode data");
      return;
    }
    toast.success("Barcode generated successfully");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Generator Form */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Barcode/QR Code</CardTitle>
          <CardDescription>Create barcodes for your products</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              placeholder="e.g., Product A"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcodeType">Barcode Type</Label>
            <Select value={barcodeType} onValueChange={setBarcodeType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ean13">EAN-13 (Standard)</SelectItem>
                <SelectItem value="code128">Code 128</SelectItem>
                <SelectItem value="qr">QR Code</SelectItem>
                <SelectItem value="code39">Code 39</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcodeData">Barcode Data</Label>
            <Input
              id="barcodeData"
              placeholder={barcodeType === "qr" ? "Enter any text" : "Enter numeric code"}
              value={barcodeData}
              onChange={(e) => setBarcodeData(e.target.value)}
            />
            <p className="text-muted-foreground">
              {barcodeType === "ean13" && "13 digits required"}
              {barcodeType === "code128" && "Alphanumeric allowed"}
              {barcodeType === "qr" && "Any text, URL, or data"}
              {barcodeType === "code39" && "Alphanumeric allowed"}
            </p>
          </div>

          <Button className="w-full gap-2" onClick={handleGenerate}>
            {barcodeType === "qr" ? <QrCode className="size-4" /> : <Barcode className="size-4" />}
            Generate {barcodeType === "qr" ? "QR Code" : "Barcode"}
          </Button>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Barcode Preview</CardTitle>
          <CardDescription>Preview and download generated barcode</CardDescription>
        </CardHeader>
        <CardContent>
          {barcodeData ? (
            <div className="space-y-4">
              {/* Barcode Preview */}
              <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-8 min-h-[200px] bg-white">
                {barcodeType === "qr" ? (
                  <div className="text-center space-y-4">
                    <QrCode className="size-32 mx-auto text-foreground" />
                    <p className="text-muted-foreground">QR Code Preview</p>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <Barcode className="size-32 mx-auto text-foreground" />
                    <p className="text-foreground font-mono">{barcodeData}</p>
                    <p className="text-muted-foreground">Barcode Preview</p>
                  </div>
                )}
              </div>

              {/* Product Info */}
              {productName && (
                <div className="p-4 bg-accent rounded-lg">
                  <p className="text-muted-foreground">Product</p>
                  <p className="text-foreground">{productName}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="gap-2" onClick={() => toast.success("Downloaded")}>
                  <Download className="size-4" />
                  Download
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => toast.success("Printing")}>
                  <Printer className="size-4" />
                  Print
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 min-h-[200px]">
              <Barcode className="size-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Enter barcode data to generate preview
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Generation */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Bulk Barcode Generation</CardTitle>
          <CardDescription>Generate barcodes for multiple products at once</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="category">By Category</SelectItem>
                  <SelectItem value="selected">Selected Products</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => toast.success("Generating bulk barcodes")}>
                Generate All Barcodes
              </Button>
              <Button variant="outline" onClick={() => toast.success("Downloading")}>
                <Download className="size-4 mr-2" />
                Download as PDF
              </Button>
            </div>
            <p className="text-muted-foreground">
              Generate barcodes for all products in your inventory at once. Useful for printing labels.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

