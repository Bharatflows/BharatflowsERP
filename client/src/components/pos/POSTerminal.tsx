import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PageLayout } from '../system/PageLayout';
import { posService } from '../../services/modules.service';
import { useProducts } from '../../hooks/useInventory';
import { ThermalReceipt } from './ThermalReceipt';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import syncService from '../../services/syncService';
import { generateOfflineId } from '../../lib/db';

// Subcomponents
import { POSHeader, ProductGrid, CartSection, HeldOrdersDialog } from './terminal';

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
        toast.success(`added ${product.name}`);
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
        // Force re-render happens naturally via dialog reopening or external state if lifted
        // For now, we close it to simplify
        setShowRecallDialog(false);
        setTimeout(() => setShowRecallDialog(true), 100);
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
        <PageLayout
            title="POS Terminal"
            description="Quick billing & checkout"
            className="h-[calc(100dvh-4rem)] p-0" // Remove standard padding for full-screen POS
        >
            <div className="flex h-full gap-4 pb-4">
                {/* Left Side: Product Search & Grid */}
                <div className="flex-1 flex flex-col gap-4 min-w-0">
                    <POSHeader
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        onShowShortcuts={() => setShowShortcuts(true)}
                        searchInputRef={searchInputRef}
                    />

                    <ProductGrid
                        loading={loading}
                        products={filteredProducts}
                        onProductClick={(p) => addToCart(p)}
                    />
                </div>

                {/* Right Side: Cart & Checkout */}
                <CartSection
                    cart={cart}
                    onUpdateQuantity={updateQuantity}
                    onClearCart={clearCart}
                    onHoldOrder={holdOrder}
                    onRecallClick={() => setShowRecallDialog(true)}
                    onCheckout={handleCheckout}
                    totalAmount={totalAmount}
                />

                {/* Dialogs */}
                <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Keyboard Shortcuts</DialogTitle></DialogHeader>
                        <div className="grid gap-2">
                            {KEYBOARD_SHORTCUTS.map(s => (
                                <div key={s.key} className="flex justify-between border-b py-2">
                                    <span>{s.action}</span>
                                    <kbd className="bg-muted px-2 rounded font-mono text-sm">{s.key}</kbd>
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>

                <HeldOrdersDialog
                    open={showRecallDialog}
                    onOpenChange={setShowRecallDialog}
                    heldOrders={JSON.parse(localStorage.getItem('pos_held_orders') || '[]')}
                    onRecall={recallOrder}
                    onDelete={deleteHeldOrder}
                />

                <ThermalReceipt data={receiptData} />
            </div>
        </PageLayout>
    );
};

export default POSTerminal;


