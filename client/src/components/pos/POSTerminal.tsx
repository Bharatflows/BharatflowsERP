import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { posService } from '../../services/modules.service';
import { useProducts } from '../../hooks/useInventory';
import { Search, Loader2, Package, Minus, Plus, Trash2, Keyboard, X } from 'lucide-react';
import { ThermalReceipt } from './ThermalReceipt';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import syncService from '../../services/syncService';
import { generateOfflineId } from '../../lib/db';

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

const KEYBOARD_SHORTCUTS = [
    { key: "F1", action: "Checkout (Pay Cash)" },
    { key: "F2", action: "Focus Search" },
    { key: "F3", action: "Clear Cart" },
    { key: "F4", action: "Pay UPI" },
    { key: "F6", action: "Hold Order" },
    { key: "F7", action: "Recall Order" },
    { key: "Escape", action: "Clear Search" },
    { key: "?", action: "Show Shortcuts Help" },
];

const POSTerminal = () => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showRecallDialog, setShowRecallDialog] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const barcodeBuffer = useRef<string>('');
    const lastKeyTime = useRef<number>(0);

    // Fetch real products
    const { data: productsResponse, isLoading: loading } = useProducts();
    const products = productsResponse?.data || [];

    // In a real app, this would come from the active session context
    const sessionId = "dummysessionid";

    // Filter products
    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return products.slice(0, 20);
        const query = searchQuery.toLowerCase();
        return products.filter((p: any) =>
            p.name.toLowerCase().includes(query) ||
            (p.code && p.code.toLowerCase().includes(query)) ||
            (p.barcode && p.barcode.toLowerCase().includes(query))
        ).slice(0, 20);
    }, [products, searchQuery]);

    const addToCart = (product: any, qty: number = 1) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + qty } : item);
            }
            return [...prev, {
                id: product.id,
                name: product.name,
                price: Number(product.sellingPrice) || 0,
                quantity: qty
            }];
        });
        toast.success(`Added ${product.name}`);
        // Play beep sound logic here if needed
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                return { ...item, quantity: Math.max(0, item.quantity + delta) };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
    const clearCart = () => { setCart([]); toast.info("Cart cleared"); };

    const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // --- Hold / Recall Logic ---
    const holdOrder = () => {
        if (cart.length === 0) return toast.error("Cart is empty");
        const heldOrders = JSON.parse(localStorage.getItem('pos_held_orders') || '[]');
        heldOrders.push({
            id: Date.now(),
            date: new Date().toISOString(),
            items: cart,
            total: totalAmount,
            reference: `Order #${heldOrders.length + 1}`
        });
        localStorage.setItem('pos_held_orders', JSON.stringify(heldOrders));
        setCart([]);
        toast.success("Order placed on Hold");
    };

    const recallOrder = (order: any) => {
        if (cart.length > 0) {
            if (!confirm("Current cart will be replaced. Continue?")) return;
        }
        setCart(order.items);
        const heldOrders = JSON.parse(localStorage.getItem('pos_held_orders') || '[]');
        const newHeld = heldOrders.filter((o: any) => o.id !== order.id);
        localStorage.setItem('pos_held_orders', JSON.stringify(newHeld));
        setShowRecallDialog(false);
        toast.success("Order Recalled");
    };

    const deleteHeldOrder = (id: number) => {
        const heldOrders = JSON.parse(localStorage.getItem('pos_held_orders') || '[]');
        const newHeld = heldOrders.filter((o: any) => o.id !== id);
        localStorage.setItem('pos_held_orders', JSON.stringify(newHeld));
        // Force re-render of dialog content by refetching in the dialog component or state
        // For simplicity, we trigger a state update
        setShowRecallDialog(false);
        setTimeout(() => setShowRecallDialog(true), 0);
    };

    // --- Barcode Scanner Logic ---
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            const now = Date.now();

            // Scanner Detection: Fast input (< 30ms between keys)
            if (now - lastKeyTime.current > 30) {
                barcodeBuffer.current = ''; // Reset buffer if too slow (manual typing)
            }
            lastKeyTime.current = now;

            if (e.key === 'Enter') {
                if (barcodeBuffer.current.length > 3) {
                    // Start Scan Processing
                    const code = barcodeBuffer.current;
                    const product = products.find((p: any) =>
                        p.barcode === code || p.code === code
                    );

                    if (product) {
                        addToCart(product);
                        e.preventDefault(); // Prevent enter from submitting forms
                        barcodeBuffer.current = '';
                        return;
                    }
                }
                barcodeBuffer.current = '';
            } else if (e.key.length === 1) {
                barcodeBuffer.current += e.key;
            }

            // Shortcuts
            const isInput = document.activeElement?.tagName === 'INPUT';
            if (!isInput || e.key.startsWith('F')) {
                if (e.key === 'F1') { e.preventDefault(); handleCheckout('CASH'); }
                if (e.key === 'F2') { e.preventDefault(); searchInputRef.current?.focus(); }
                if (e.key === 'F3') { e.preventDefault(); clearCart(); }
                if (e.key === 'F4') { e.preventDefault(); handleCheckout('UPI'); }
                if (e.key === 'F6') { e.preventDefault(); holdOrder(); }
                if (e.key === 'F7') { e.preventDefault(); setShowRecallDialog(true); }
                if (e.key === 'Escape') { setShowShortcuts(false); setShowRecallDialog(false); }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [cart, products]); // Re-bind when cart/products change

    const handleCheckout = async (mode: 'CASH' | 'UPI') => {
        if (cart.length === 0) return toast.error("Cart is empty");

        try {
            const isOnline = syncService.getNetworkStatus();
            let orderId = `ORD-${Date.now()}`;

            // Prepare Order Data
            const orderPayload = {
                sessionId,
                items: cart.map(i => ({ productId: i.id, quantity: i.quantity, price: i.price, productName: i.name })),
                totalAmount,
                paymentMode: mode
            };

            if (isOnline) {
                // Try Online First
                try {
                    const res = await posService.createOrder(orderPayload);
                    if (res.data && res.data.id) orderId = res.data.orderNumber || res.data.id;
                } catch (err) {
                    // Fallback to Offline if network fails
                    console.warn("Network failed, queuing offline...", err);
                    const offlineId = generateOfflineId();
                    await syncService.queueChange('posOrders', 'create', offlineId, {
                        ...orderPayload,
                        id: offlineId,
                        orderNumber: orderId,
                        companyId: 'current', // Ideally from context
                        createdAt: new Date().toISOString()
                    });
                    toast.warning("Network Unstable. Saved Offline.");
                }
            } else {
                // Offline Mode
                const offlineId = generateOfflineId();
                await syncService.queueChange('posOrders', 'create', offlineId, {
                    ...orderPayload,
                    id: offlineId,
                    orderNumber: orderId,
                    companyId: 'current', // Ideally from context
                    createdAt: new Date().toISOString()
                });
                toast.info("Offline Mode: Order Queued.");
            }

            // Print Logic
            setReceiptData({
                companyName: "BharatFlow Enterprise",
                orderNumber: orderId,
                date: new Date(),
                items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price, total: i.price * i.quantity })),
                subtotal: totalAmount,
                tax: 0,
                total: totalAmount,
                paymentMode: mode
            });

            toast.success("Order Placed");
            setTimeout(() => {
                window.print();
                setCart([]);
            }, 500);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div className="flex h-screen p-4 gap-4 bg-background">
            {/* ... Left Side (Unchanged Logic, just simplified JSX structure for brevity) ... */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input ref={searchInputRef} placeholder="Search products... (F2)" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setShowShortcuts(true)}><Keyboard className="h-4 w-4" /></Button>
                </div>

                <div className="flex-1 overflow-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
                    {loading ? <Loader2 className="animate-spin" /> : filteredProducts.map((p: any) => (
                        <Card key={p.id} className="cursor-pointer hover:border-primary h-fit" onClick={() => addToCart(p)}>
                            <CardHeader className="p-3 pb-1"><CardTitle className="text-sm line-clamp-2">{p.name}</CardTitle></CardHeader>
                            <CardContent className="p-3 pt-1">
                                <div className="font-bold text-primary">₹{Number(p.sellingPrice).toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground">Stk: {p.currentStock}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Right Side: Cart */}
            <Card className="w-1/3 min-w-[300px] flex flex-col">
                <CardHeader className="border-b py-3">
                    <div className="flex items-center justify-between">
                        <CardTitle>Order</CardTitle>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={holdOrder} title="Hold Order (F6)">Hold</Button>
                            <Button variant="outline" size="sm" onClick={() => setShowRecallDialog(true)} title="Recall Order (F7)">Recall</Button>
                            <Button variant="ghost" size="sm" onClick={clearCart} title="Clear (F3)"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-0">
                    {cart.map(item => (
                        <div key={item.id} className="flex justify-between p-3 border-b hover:bg-muted/50">
                            <div className="flex-1">
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-muted-foreground">₹{item.price} x {item.quantity}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQuantity(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                                <span className="w-4 text-center">{item.quantity}</span>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQuantity(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
                <div className="p-4 border-t bg-muted/20 space-y-3">
                    <div className="flex justify-between text-2xl font-bold">
                        <span>Total</span>
                        <span>₹{totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button size="lg" onClick={() => handleCheckout('CASH')}>CASH (F1)</Button>
                        <Button size="lg" variant="outline" onClick={() => handleCheckout('UPI')}>UPI (F4)</Button>
                    </div>
                </div>
            </Card>

            {/* Shortcuts Dialog */}
            <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Keyboard Shortcuts</DialogTitle></DialogHeader>
                    <div className="grid gap-2">
                        {KEYBOARD_SHORTCUTS.map(s => (
                            <div key={s.key} className="flex justify-between border-b py-2">
                                <span>{s.action}</span>
                                <kbd className="bg-muted px-2 rounded">{s.key}</kbd>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Recall Dialog */}
            <Dialog open={showRecallDialog} onOpenChange={setShowRecallDialog}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Held Orders</DialogTitle></DialogHeader>
                    <div className="space-y-2 max-h-[60vh] overflow-auto">
                        {JSON.parse(localStorage.getItem('pos_held_orders') || '[]').length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">No held orders</p>
                        ) : (
                            JSON.parse(localStorage.getItem('pos_held_orders') || '[]').map((o: any) => (
                                <div key={o.id} className="flex justify-between items-center p-3 border rounded hover:bg-muted/50">
                                    <div>
                                        <div className="font-medium">{o.reference}</div>
                                        <div className="text-xs text-muted-foreground">{new Date(o.date).toLocaleTimeString()} • {o.items.length} items</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="font-bold mr-2">₹{o.total}</div>
                                        <Button size="sm" variant="default" onClick={() => recallOrder(o)}>Resume</Button>
                                        <Button size="sm" variant="ghost" onClick={() => deleteHeldOrder(o.id)}><X className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <ThermalReceipt data={receiptData} />
        </div>
    );
};

export default POSTerminal;


