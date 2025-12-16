import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { BarcodeGenerator } from "./BarcodeGenerator";
import { BarcodeScanner } from "./BarcodeScanner";
import { ProductLookup } from "./ProductLookup";

export function BarcodeModule() {
  const [activeTab, setActiveTab] = useState("generate");

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc]">
      <div className="p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-foreground mb-2">Barcode & QR Code Management</h1>
          <p className="text-muted-foreground">
            Generate barcodes, scan products, and manage inventory with QR codes
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="generate">Generate Barcode</TabsTrigger>
              <TabsTrigger value="scan">Scan Barcode</TabsTrigger>
              <TabsTrigger value="lookup">Product Lookup</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="generate" className="mt-6">
            <BarcodeGenerator />
          </TabsContent>

          <TabsContent value="scan" className="mt-6">
            <BarcodeScanner />
          </TabsContent>

          <TabsContent value="lookup" className="mt-6">
            <ProductLookup />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
