import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { BarcodeGenerator } from "./BarcodeGenerator";
import { BarcodeScanner } from "./BarcodeScanner";
import { ProductLookup } from "./ProductLookup";
import { ModuleHeader } from "../ui/module-header";
import { QrCode } from "lucide-react";

export function BarcodeModule() {
  const [activeTab, setActiveTab] = useState("generate");

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="p-4 md:p-6">
        <ModuleHeader
          title="Barcode & QR Code Management"
          description="Generate barcodes, scan products, and manage inventory with QR codes"
          showBackButton={true}
          backTo="/dashboard"
          icon={<QrCode className="size-5 text-primary" />}
        />

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
