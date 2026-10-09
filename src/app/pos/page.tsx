'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, CartItem, DiscountType, PaymentMethod, Sale, Customer, Quotation } from '@/lib/types';
import BarcodeScannerInput from '@/components/pos/BarcodeScannerInput';
import ProductCatalog from '@/components/pos/ProductCatalog';
import CartDrawer from '@/components/pos/CartDrawer';
import PaymentModal from '@/components/pos/PaymentModal';
import ReceiptModal from '@/components/receipt/ReceiptModal';
import QuotationModal from '@/components/quotation/QuotationModal';
import CustomerQuickSelectModal from '@/components/customers/CustomerQuickSelectModal';
import CustomerFormModal from '@/components/customers/CustomerFormModal';
import CashierShiftModal from '@/components/pos/CashierShiftModal';
import SalesReturnModal from '@/components/pos/SalesReturnModal';
import ScreenLockModal from '@/components/pos/ScreenLockModal';
import { useIdleTimer } from '@/hooks/useIdleTimer';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import confetti from 'canvas-confetti';
import { Clock, RotateCcw, Lock } from 'lucide-react';

// In-memory product catalog cache for instant navigation & zero latency
let cachedCatalog: Product[] | null = null;

export default function POSPage() {
  const { toast } = useToast();
  const { currentUser, logout, openSwitchModal } = useAuth();
  const { settings } = useSettings();

  // Initialize with cached catalog if available for instant 0ms mount
  const [products, setProducts] = useState<Product[]>(() => cachedCatalog || []);
  const [isLoading, setIsLoading] = useState<boolean>(() => !cachedCatalog);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Cart & Customer State (pure client-side)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [discountType, setDiscountType] = useState<DiscountType>('NONE');
  const [discountValue, setDiscountValue] = useState<number>(0);
  
  // Tax state: strictly OFF by default (0%)
  const [taxRate, setTaxRate] = useState<number>(0);

  // Modals
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [isProcessingSale, setIsProcessingSale] = useState<boolean>(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Cashier Shift & Return Modals
  const [isShiftModalOpen, setIsShiftModalOpen] = useState<boolean>(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState<boolean>(false);

  // Customer Modals
  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState<boolean>(false);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState<boolean>(false);

  // Quotation Modal
  const [isQuotationOpen, setIsQuotationOpen] = useState<boolean>(false);
  const [generatedQuotation, setGeneratedQuotation] = useState<Quotation | null>(null);

  // POS Idle / Inactivity Screen Lock State (2 minutes timeout)
  const [isScreenLocked, setIsScreenLocked] = useState<boolean>(false);

  const { resetTimer } = useIdleTimer({
    timeoutMs: 120000, // 2 minutes inactivity timeout
    enabled: !!currentUser && !isScreenLocked,
    onIdle: () => {
      setIsScreenLocked(true);
    },
  });

  const handleUnlockScreen = useCallback(() => {
    setIsScreenLocked(false);
    resetTimer();
    toast('POS Register unlocked! Ready for billing.', 'success');
  }, [resetTimer, toast]);

  // Fetch product catalog and store in memory cache
  const fetchProducts = useCallback(async (silent = false) => {
    try {
      if (!silent && !cachedCatalog) {
        setIsLoading(true);
      }
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        cachedCatalog = data.products;
        setProducts(data.products);
      } else {
        toast(data.error || 'Failed to load catalog', 'error');
      }
    } catch (err: any) {
      toast('Network error loading products', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // Fetch fresh catalog on mount (silent if already populated from memory)
    fetchProducts(!!cachedCatalog);
  }, [fetchProducts]);

  // Memoized O(1) product lookup maps
  const productBySku = useMemo(() => {
    const map = new Map<string, Product>();
    for (let i = 0; i < products.length; i++) {
      map.set(products[i].sku.toLowerCase(), products[i]);
    }
    return map;
  }, [products]);

  // Memoized categories extraction
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return cats.sort();
  }, [products]);

  // Instant in-memory search and category filtering
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const isAllCategories = selectedCategory === 'All';

    if (!query && isAllCategories) {
      return products;
    }

    return products.filter((p) => {
      const matchesCategory = isAllCategories || p.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!query) return true;

      return (
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    });
  }, [products, searchQuery, selectedCategory]);

  // 100% Client-side instant cart state actions with stable useCallback references
  const handleAddToCart = useCallback((product: Product) => {
    if (product.stockQuantity <= 0) {
      toast(`"${product.name}" is out of stock!`, 'error');
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        if (existing.quantity >= product.stockQuantity) {
          toast(`Cannot add more than ${product.stockQuantity} units available.`, 'error');
          return prev;
        }
        const next = [...prev];
        next[existingIndex] = { ...existing, quantity: existing.quantity + 1 };
        return next;
      }
      return [...prev, { product, quantity: 1 }];
    });

    toast(`Added "${product.name}" to cart`, 'success');
  }, [toast]);

  const handleUpdateQuantity = useCallback((productId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === productId);
      if (existingIndex === -1) return prev;
      const existing = prev[existingIndex];
      if (newQty > existing.product.stockQuantity) {
        toast(`Only ${existing.product.stockQuantity} units available in stock`, 'error');
        return prev;
      }
      const next = [...prev];
      next[existingIndex] = { ...existing, quantity: newQty };
      return next;
    });
  }, [toast]);

  const handleRemoveItem = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
    setDiscountType('NONE');
    setDiscountValue(0);
    setTaxRate(0); // Reset tax back to OFF by default
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
  }, []);

  // Instant barcode scanner enter handler (O(1) SKU lookup first)
  const handleBarcodeEnterScan = useCallback((term: string) => {
    const clean = term.trim().toLowerCase();
    if (!clean) return;

    // 1. O(1) Instant exact SKU match
    const exactSkuMatch = productBySku.get(clean);
    if (exactSkuMatch) {
      handleAddToCart(exactSkuMatch);
      setSearchQuery('');
      return;
    }

    // 2. Fallback to searching name or partial SKU in memory
    const nameMatch = products.find(
      (p) => p.sku.toLowerCase().includes(clean) || p.name.toLowerCase().includes(clean)
    );

    if (nameMatch) {
      handleAddToCart(nameMatch);
      setSearchQuery('');
    } else {
      toast(`No product found with barcode or name: "${term}"`, 'error');
    }
  }, [productBySku, products, handleAddToCart, toast]);

  // Stable callbacks for customer & cart options
  const handleApplyDiscount = useCallback((type: DiscountType, val: number) => {
    setDiscountType(type);
    setDiscountValue(val);
  }, []);

  const handleToggleTax = useCallback(() => {
    setTaxRate((prev) => (prev > 0 ? 0 : (settings.taxRate || 0.08)));
  }, [settings.taxRate]);

  const handleOpenCustomerSelect = useCallback(() => {
    setIsCustomerSelectOpen(true);
  }, []);

  const handleClearCustomer = useCallback(() => {
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
  }, []);

  const handleProceedToPayment = useCallback(() => {
    setIsPaymentOpen(true);
  }, []);

  // Compute total for payment modal
  const grandTotal = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
    let discountAmount = 0;
    if (discountType === 'PERCENTAGE' && discountValue > 0) {
      discountAmount = +(subtotal * (discountValue / 100)).toFixed(2);
    } else if (discountType === 'FIXED' && discountValue > 0) {
      discountAmount = Math.min(subtotal, discountValue);
    }
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const taxAmount = +(discountedSubtotal * taxRate).toFixed(2);
    return +(discountedSubtotal + taxAmount).toFixed(2);
  }, [cart, discountType, discountValue, taxRate]);

  // Complete checkout
  const handleCompleteSale = useCallback(async (
    paymentMethod: PaymentMethod,
    amountPaid: number,
    notes?: string,
    checkoutPhone?: string
  ) => {
    try {
      setIsProcessingSale(true);
      const finalCustomerPhone = checkoutPhone !== undefined 
        ? checkoutPhone 
        : (selectedCustomer ? selectedCustomer.phone : customerPhone);

      const payload = {
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.sellingPrice,
        })),
        customerId: selectedCustomer?.id || undefined,
        customerName: selectedCustomer ? selectedCustomer.name : (customerName.trim() || 'Walk-in Customer'),
        customerPhone: finalCustomerPhone?.trim() || undefined,
        cashierId: currentUser?.id || null,
        cashierName: currentUser?.name || 'Cashier',
        discountType,
        discountValue,
        taxRate,
        paymentMethod,
        amountPaid,
        notes,
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success && data.sale) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#f43f5e', '#fb7185', '#fbcfe8', '#d946ef'],
        });

        toast(`Sale ${data.sale.receiptNo} completed!`, 'success');
        setCompletedSale(data.sale);
        setIsPaymentOpen(false);
        setIsReceiptOpen(true);
        handleClearCart();
        // Refresh catalog stocks in the background
        fetchProducts(true);
      } else {
        toast(data.error || 'Failed to process transaction', 'error');
      }
    } catch (err: any) {
      toast('Transaction failed due to network error', 'error');
    } finally {
      setIsProcessingSale(false);
    }
  }, [
    cart,
    selectedCustomer,
    customerName,
    customerPhone,
    currentUser,
    discountType,
    discountValue,
    taxRate,
    toast,
    handleClearCart,
    fetchProducts
  ]);

  // Generate Quotation / Proforma Invoice
  const handleGenerateQuotation = useCallback(async () => {
    if (cart.length === 0) {
      toast('Cart is empty. Add products to generate quotation.', 'error');
      return;
    }

    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          productSku: item.product.sku,
          quantity: item.quantity,
          unitPrice: item.product.sellingPrice,
        })),
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer ? selectedCustomer.name : (customerName.trim() || 'Valued Customer'),
        customerPhone: selectedCustomer?.phone || customerPhone || '',
        customerEmail: selectedCustomer?.email || '',
        customerAddress: selectedCustomer?.address || '',
        discountType,
        discountValue,
        taxRate,
      };

      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.quotation) {
        toast(`Quotation ${data.quotation.quotationNo} generated!`, 'success');
        setGeneratedQuotation(data.quotation);
        setIsQuotationOpen(true);
      } else {
        toast(data.error || 'Failed to generate quotation', 'error');
      }
    } catch (err) {
      toast('Network error creating quotation', 'error');
    }
  }, [cart, selectedCustomer, customerName, customerPhone, discountType, discountValue, taxRate, toast]);

  // Quick register customer from POS
  const handleQuickRegisterCustomer = useCallback(async (data: Partial<Customer>): Promise<boolean> => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (resData.success && resData.customer) {
        toast(`Customer "${resData.customer.name}" registered!`, 'success');
        setSelectedCustomer(resData.customer);
        setCustomerName(resData.customer.name);
        setCustomerPhone(resData.customer.phone || '');
        return true;
      } else {
        toast(resData.error || 'Failed to register customer', 'error');
        return false;
      }
    } catch (err) {
      toast('Network error registering customer', 'error');
      return false;
    }
  }, [toast]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 h-[calc(100vh-4rem)] flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        {/* Left Column: Product Search & Catalog (8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full space-y-3.5 min-h-0">
          {/* Top Barcode / Search Bar & Action Buttons */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <BarcodeScannerInput
                value={searchQuery}
                onChange={setSearchQuery}
                onEnterScan={handleBarcodeEnterScan}
              />
            </div>

            {/* My Shift / Today's Sales Button */}
            <button
              type="button"
              onClick={() => setIsShiftModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all shadow-2xs shrink-0 font-display cursor-pointer"
              title="View your sales stats for today's shift"
            >
              <Clock className="w-4 h-4 text-pink-600" />
              <span className="hidden md:inline">My Shift / Today&apos;s Sales</span>
              <span className="md:hidden">Shift</span>
            </button>

            {/* Sales Return / Refund Button */}
            <button
              type="button"
              onClick={() => setIsReturnModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-700 text-xs font-bold transition-all shadow-2xs shrink-0 font-display cursor-pointer"
              title="Process a customer return and refund voucher"
            >
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span className="hidden md:inline">Sales Return / Refund</span>
              <span className="md:hidden">Return</span>
            </button>

            {/* Manual Screen Lock Button */}
            <button
              type="button"
              onClick={() => setIsScreenLocked(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-600 hover:text-stone-900 text-xs font-bold transition-all shadow-2xs shrink-0 font-display cursor-pointer"
              title="Lock POS register screen"
            >
              <Lock className="w-4 h-4 text-stone-500" />
              <span className="hidden md:inline">Lock Screen</span>
              <span className="md:hidden">Lock</span>
            </button>
          </div>

          {/* Catalog Grid (Memoized - does NOT re-render when cart state changes) */}
          <div className="flex-1 min-h-0">
            <ProductCatalog
              products={filteredProducts}
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onAddToCart={handleAddToCart}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Right Column: Interactive Cart & Payment Area (4/5 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 h-full min-h-0 flex flex-col">
          <CartDrawer
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            selectedCustomer={selectedCustomer}
            customerName={customerName}
            customerPhone={customerPhone}
            onCustomerPhoneChange={setCustomerPhone}
            onOpenCustomerSelect={handleOpenCustomerSelect}
            onClearCustomer={handleClearCustomer}
            discountType={discountType}
            discountValue={discountValue}
            onApplyDiscount={handleApplyDiscount}
            taxRate={taxRate}
            onToggleTax={handleToggleTax}
            onProceedToPayment={handleProceedToPayment}
            onGenerateQuotation={handleGenerateQuotation}
          />
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        totalAmount={grandTotal}
        customerName={selectedCustomer ? selectedCustomer.name : (customerName || 'Walk-in Customer')}
        initialCustomerPhone={selectedCustomer ? selectedCustomer.phone : customerPhone}
        onCompleteSale={handleCompleteSale}
        isProcessing={isProcessingSale}
      />

      {/* Printable Thermal Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        sale={completedSale}
        onClose={() => setIsReceiptOpen(false)}
        onNewSale={() => {
          setIsReceiptOpen(false);
          setCompletedSale(null);
        }}
      />

      {/* Printable A4 Quotation / Proforma Invoice Modal */}
      <QuotationModal
        isOpen={isQuotationOpen}
        quotation={generatedQuotation}
        onClose={() => setIsQuotationOpen(false)}
      />

      {/* Customer Quick Select Modal */}
      <CustomerQuickSelectModal
        isOpen={isCustomerSelectOpen}
        onClose={() => setIsCustomerSelectOpen(false)}
        onSelectCustomer={(c) => {
          setSelectedCustomer(c);
          if (c) {
            setCustomerName(c.name);
            setCustomerPhone(c.phone || '');
          } else {
            setCustomerName('');
            setCustomerPhone('');
          }
        }}
        selectedCustomerId={selectedCustomer?.id}
        onOpenNewCustomerModal={() => setIsNewCustomerOpen(true)}
      />

      {/* Quick Register New Customer Modal */}
      <CustomerFormModal
        isOpen={isNewCustomerOpen}
        onClose={() => setIsNewCustomerOpen(false)}
        onSave={handleQuickRegisterCustomer}
      />

      {/* Cashier Shift Summary Modal */}
      <CashierShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
      />

      {/* Sales Return / Refund Modal */}
      <SalesReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onReturnProcessed={() => {
          fetchProducts(true);
        }}
      />

      {/* Inactivity & Manual Screen Lock Modal */}
      <ScreenLockModal
        isOpen={isScreenLocked}
        user={currentUser}
        cart={cart}
        customerName={selectedCustomer ? selectedCustomer.name : (customerName || 'Walk-in Customer')}
        onUnlock={handleUnlockScreen}
        onSwitchUser={openSwitchModal}
        onLogout={logout}
      />
    </div>
  );
}
