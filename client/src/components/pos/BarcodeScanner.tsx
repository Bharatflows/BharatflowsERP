import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
    ScanBarcode,
    Volume2,
    VolumeX,
    Package,
    Plus,
    History,
    Settings,
} from "lucide-react";
import { toast } from "sonner";

interface ScannedProduct {
    barcode: string;
    productName: string;
    productCode: string;
    sellingPrice: number;
    stock: number;
    timestamp: Date;
}

export function BarcodeScanner() {
    const [isListening, setIsListening] = useState(false);
    const [barcodeBuffer, setBarcodeBuffer] = useState("");
    const [lastScanned, setLastScanned] = useState<ScannedProduct | null>(null);
    const [scanHistory, setScanHistory] = useState<ScannedProduct[]>([]);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Simulated product lookup
    const lookupProduct = (barcode: string): ScannedProduct | null => {
        // Mock product database
        const products: Record<string, Omit<ScannedProduct, "barcode" | "timestamp">> = {
            "8901234567890": { productName: "Samsung Galaxy A54", productCode: "PROD-001", sellingPrice: 32999, stock: 15 },
            "8901234567891": { productName: "iPhone 15 Case", productCode: "PROD-002", sellingPrice: 999, stock: 50 },
            "8901234567892": { productName: "USB-C Cable 1m", productCode: "PROD-003", sellingPrice: 299, stock: 100 },
            "8901234567893": { productName: "Wireless Earbuds", productCode: "PROD-004", sellingPrice: 2499, stock: 25 },
        };

        const product = products[barcode];
        if (product) {
            return { ...product, barcode, timestamp: new Date() };
        }
        return null;
    };

    const playBeep = useCallback(() => {
        if (soundEnabled) {
            // Create a simple beep sound
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 1000;
            oscillator.type = "sine";
            gainNode.gain.value = 0.3;

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        }
    }, [soundEnabled]);

    const handleBarcodeScan = useCallback((barcode: string) => {
        const product = lookupProduct(barcode);

        if (product) {
            playBeep();
            setLastScanned(product);
            setScanHistory((prev) => [product, ...prev.slice(0, 19)]);
            toast.success(`Found: ${product.productName}`);
        } else {
            toast.error(`Product not found: ${barcode}`);
        }
    }, [playBeep]);

    // Listen for keyboard input (USB barcode scanners act as keyboards)
    useEffect(() => {
        if (!isListening) return;

        let timeout: NodeJS.Timeout;

        const handleKeyPress = (e: KeyboardEvent) => {
            // Ignore if typing in an input field
            if ((e.target as HTMLElement).tagName === "INPUT") return;

            // Enter key means end of barcode
            if (e.key === "Enter" && barcodeBuffer.length > 5) {
                handleBarcodeScan(barcodeBuffer);
                setBarcodeBuffer("");
                return;
            }

            // Only accept numbers
            if (/^\d$/.test(e.key)) {
                setBarcodeBuffer((prev) => prev + e.key);

                // Reset buffer after 100ms of no input
                clearTimeout(timeout);
                timeout = setTimeout(() => setBarcodeBuffer(""), 100);
            }
        };

        window.addEventListener("keypress", handleKeyPress);
        return () => {
            window.removeEventListener("keypress", handleKeyPress);
            clearTimeout(timeout);
        };
    }, [isListening, barcodeBuffer, handleBarcodeScan]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleManualInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            const barcode = (e.target as HTMLInputElement).value;
            if (barcode.length >= 8) {
                handleBarcodeScan(barcode);
                (e.target as HTMLInputElement).value = "";
            }
        }
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Barcode Scanner</h1>
                    <p className="text-muted-foreground">
                        Scan products using USB barcode scanner or enter manually
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                    >
                        {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                    <Button
                        variant={isListening ? "destructive" : "default"}
                        onClick={() => setIsListening(!isListening)}
                    >
                        <ScanBarcode className="h-4 w-4 mr-2" />
                        {isListening ? "Stop Listening" : "Start Listening"}
                    </Button>
                </div>
            </div>

            {/* Scanner Status */}
            <Card className={isListening ? "border-green-500 bg-green-50" : ""}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-full ${isListening ? "bg-green-100 animate-pulse" : "bg-muted"}`}>
                                <ScanBarcode className={`h-8 w-8 ${isListening ? "text-green-600" : "text-muted-foreground"}`} />
                            </div>
                            <div>
                                <p className="font-medium text-lg">
                                    {isListening ? "Scanner Active" : "Scanner Inactive"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {isListening
                                        ? "Ready to scan. Point barcode scanner at product."
                                        : "Click 'Start Listening' to begin scanning"}
                                </p>
                            </div>
                        </div>
                        {barcodeBuffer && (
                            <Badge variant="outline" className="font-mono text-lg">
                                {barcodeBuffer}
                            </Badge>
                        )}
                    </div>

                    {/* Manual Input */}
                    <div className="mt-4">
                        <Input
                            placeholder="Or type barcode manually and press Enter..."
                            onKeyPress={handleManualInput}
                            className="font-mono"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Last Scanned Product */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Last Scanned Product
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {lastScanned ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground">Barcode</p>
                                    <p className="font-mono text-2xl font-bold">{lastScanned.barcode}</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{lastScanned.productName}</p>
                                    <p className="text-muted-foreground">{lastScanned.productCode}</p>
                                </div>
                                <div className="flex justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Price</p>
                                        <p className="text-xl font-bold text-green-600">
                                            {formatCurrency(lastScanned.sellingPrice)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Stock</p>
                                        <Badge variant={lastScanned.stock > 10 ? "default" : "destructive"}>
                                            {lastScanned.stock} units
                                        </Badge>
                                    </div>
                                </div>
                                <Button className="w-full">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add to Cart
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <ScanBarcode className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No product scanned yet</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Scan History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Scan History
                        </CardTitle>
                        <CardDescription>Last 20 scanned items</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {scanHistory.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No scan history
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {scanHistory.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-2 border rounded hover:bg-muted/50"
                                    >
                                        <div>
                                            <p className="font-medium">{item.productName}</p>
                                            <p className="text-xs text-muted-foreground font-mono">{item.barcode}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono">{formatCurrency(item.sellingPrice)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.timestamp.toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Test Barcodes */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Test Barcodes (Demo)
                    </CardTitle>
                    <CardDescription>Click to simulate scanning</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {["8901234567890", "8901234567891", "8901234567892", "8901234567893"].map((code) => (
                            <Button
                                key={code}
                                variant="outline"
                                onClick={() => handleBarcodeScan(code)}
                                className="font-mono"
                            >
                                {code}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default BarcodeScanner;
