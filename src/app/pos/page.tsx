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
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import confetti from 'canvas-confetti';
import { Clock, RotateCcw } from 'lucide-react';

export default function POSPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { settings } = useSettings();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Cart & Customer State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
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
  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState(false);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);

  // Quotation Modal
  const [isQuotationOpen, setIsQuotationOpen] = useState(false);
  const [generatedQuotation, setGeneratedQuotation] = useState<Quotation | null>(null);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
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
    fetchProducts();
  }, [fetchProducts]);

  // Extract categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return cats.sort();
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' || p.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Cart actions
  const handleAddToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      toast(`"${product.name}" is out of stock!`, 'error');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          toast(`Cannot add more than ${product.stockQuantity} units available.`, 'error');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    toast(`Added "${product.name}" to cart`, 'success');
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    const target = products.find((p) => p.id === productId);
    if (target && newQty > target.stockQuantity) {
      toast(`Only ${target.stockQuantity} units available in stock`, 'error');
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountType('NONE');
    setDiscountValue(0);
    setTaxRate(0); // Reset tax back to OFF by default
    setSelectedCustomer(null);
    setCustomerName('');
  };

  // Barcode enter scan
  const handleBarcodeEnterScan = (term: string) => {
    const exactSkuMatch = products.find(
      (p) => p.sku.toLowerCase() === term.toLowerCase()
    );

    if (exactSkuMatch) {
      handleAddToCart(exactSkuMatch);
      setSearchQuery('');
      return;
    }

    const nameMatch = products.find((p) =>
      p.name.toLowerCase().includes(term.toLowerCase())
    );

    if (nameMatch) {
      handleAddToCart(nameMatch);
      setSearchQuery('');
    } else {
      toast(`No product found with barcode or name: "${term}"`, 'error');
    }
  };

  // Compute total for payment
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );

  let discountAmount = 0;
  if (discountType === 'PERCENTAGE' && discountValue > 0) {
    discountAmount = +(subtotal * (discountValue / 100)).toFixed(2);
  } else if (discountType === 'FIXED' && discountValue > 0) {
    discountAmount = Math.min(subtotal, discountValue);
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = +(discountedSubtotal * taxRate).toFixed(2);
  const grandTotal = +(discountedSubtotal + taxAmount).toFixed(2);

  // Complete checkout
  const handleCompleteSale = async (
    paymentMethod: PaymentMethod,
    amountPaid: number,
    notes?: string
  ) => {
    try {
      setIsProcessingSale(true);
      const payload = {
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.sellingPrice,
        })),
        customerId: selectedCustomer?.id || undefined,
        customerName: selectedCustomer ? selectedCustomer.name : (customerName.trim() || 'Walk-in Customer'),
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
        // Refresh catalog stocks
        fetchProducts();
      } else {
        toast(data.error || 'Failed to process transaction', 'error');
      }
    } catch (err: any) {
      toast('Transaction failed due to network error', 'error');
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Generate Quotation / Proforma Invoice
  const handleGenerateQuotation = async () => {
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
        customerPhone: selectedCustomer?.phone || '',
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
  };

  // Quick register customer from POS
  const handleQuickRegisterCustomer = async (data: Partial<Customer>): Promise<boolean> => {
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
        return true;
      } else {
        toast(resData.error || 'Failed to register customer', 'error');
        return false;
      }
    } catch (err) {
      toast('Network error registering customer', 'error');
      return false;
    }
  };

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
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all shadow-2xs shrink-0 font-display"
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
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-700 text-xs font-bold transition-all shadow-2xs shrink-0 font-display"
              title="Process a customer return and refund voucher"
            >
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span className="hidden md:inline">Sales Return / Refund</span>
              <span className="md:hidden">Return</span>
            </button>
          </div>

          {/* Catalog Grid */}
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
            onOpenCustomerSelect={() => setIsCustomerSelectOpen(true)}
            onClearCustomer={() => {
              setSelectedCustomer(null);
              setCustomerName('');
            }}
            discountType={discountType}
            discountValue={discountValue}
            onApplyDiscount={(type, val) => {
              setDiscountType(type);
              setDiscountValue(val);
            }}
            taxRate={taxRate}
            onToggleTax={() => setTaxRate((prev) => (prev > 0 ? 0 : (settings.taxRate || 0.08)))}
            onProceedToPayment={() => setIsPaymentOpen(true)}
            onGenerateQuotation={handleGenerateQuotation}
          />
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        totalAmount={grandTotal}
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
          if (c) setCustomerName(c.name);
          else setCustomerName('');
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
          fetchProducts();
        }}
      />
    </div>
  );
}
