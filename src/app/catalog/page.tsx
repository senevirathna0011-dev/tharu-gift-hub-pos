'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CatalogProduct, CatalogCartItem } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import CatalogCartDrawer from '@/components/catalog/CatalogCartDrawer';
import CatalogProductCard from '@/components/catalog/CatalogProductCard';
import CatalogQuickViewModal from '@/components/catalog/CatalogQuickViewModal';
import { 
  Search, 
  Gift, 
  Sparkles, 
  CheckCircle2, 
  MessageCircle, 
  Phone, 
  MapPin, 
  Layers, 
  X, 
  ArrowUpDown, 
  ShoppingBag, 
  Check
} from 'lucide-react';

interface StoreInfo {
  shopName: string;
  shopTagline: string;
  address: string;
  phone: string;
  email: string;
  currencySymbol: string;
}

export default function PublicCatalogPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [store, setStore] = useState<StoreInfo>({
    shopName: 'Tharu Gift Hub',
    shopTagline: 'Curated Gifts, Keepsakes & Heartfelt Moments',
    address: '452 Velvet Lane, Suite 100, West District',
    phone: '+1 (555) 839-4438',
    email: 'hello@blissandbloomgifts.com',
    currencySymbol: 'Rs.',
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  
  // Quick View Modal state
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [initialModalPhotoIndex, setInitialModalPhotoIndex] = useState<number>(0);

  // Cart State
  const [cart, setCart] = useState<CatalogCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Automatically increment catalog view counter on visit or page refresh
  useEffect(() => {
    const recordCatalogView = async () => {
      try {
        await fetch('/api/catalog/view', {
          method: 'POST',
        });
      } catch (err) {
        console.error('Failed to increment catalog view counter:', err);
      }
    };

    recordCatalogView();
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('tharu_catalog_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load cart from localStorage:', err);
    }
  }, []);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('tharu_catalog_cart', JSON.stringify(cart));
    } catch (err) {
      console.error('Failed to save cart to localStorage:', err);
    }
  }, [cart]);

  // Fetch public catalog data
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/catalog');
        const data = await res.json();
        if (data.success) {
          setProducts(data.products || []);
          setCategories(data.categories || []);
          if (data.store) {
            setStore(data.store);
          }
        }
      } catch (err) {
        console.error('Failed to fetch public catalog:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = products.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;

      const matchesStock = !inStockOnly || item.inStock;

      return matchesSearch && matchesCategory && matchesStock;
    });

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.sellingPrice - b.sellingPrice);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.sellingPrice - a.sellingPrice);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, searchQuery, selectedCategory, inStockOnly, sortBy]);

  // Cart Management Functions
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  const addToCart = (product: CatalogProduct, quantity: number = 1) => {
    if (!product.inStock) return;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      } else {
        return [...prevCart, { product, quantity }];
      }
    });

    showToast(`Added ${quantity > 1 ? `${quantity}x ` : ''}"${product.name}" to cart`);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleOpenQuickView = (product: CatalogProduct, initialIndex: number = 0) => {
    setSelectedProduct(product);
    setInitialModalPhotoIndex(initialIndex);
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartGrandTotal = cart.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );

  // Helper for WhatsApp inquiry
  const handleWhatsAppInquiry = (product?: CatalogProduct) => {
    const phoneClean = store.phone ? store.phone.replace(/[^0-9+]/g, '') : '';
    let text = '';
    if (product) {
      const priceStr = formatCurrency(product.sellingPrice, store.currencySymbol || 'Rs.');
      const barcodeStr = product.sku ? ` (Barcode: ${product.sku})` : '';
      text = encodeURIComponent(
        `Hello ${store.shopName}! 🎁 I am interested in purchasing "${product.name}"${barcodeStr} (${priceStr}) from your online catalog. Is this currently available for pickup or delivery?`
      );
    } else {
      text = encodeURIComponent(
        `Hello ${store.shopName}! 🎁 I am browsing your online catalog and have a general question about your gift collection.`
      );
    }

    const whatsappUrl = phoneClean
      ? `https://wa.me/${phoneClean}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans selection:bg-pink-100 selection:text-pink-900 relative">
      
      {/* Top Boutique Announcement Bar */}
      <div className="bg-stone-900 text-stone-200 text-xs py-2 px-4 text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />
        <span>Welcome to our Digital Gift Catalog. Browse gifts, view multi-angle photos & order on WhatsApp!</span>
      </div>

      {/* Main Store Banner / Header */}
      <header className="bg-white border-b border-stone-200/80 shadow-xs sticky top-0 z-30 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Store Brand */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/25 shrink-0">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight font-display">
                    {store.shopName}
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                    Catalog
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                  {store.shopTagline}
                </p>
              </div>
            </div>

            {/* Quick Contact & Cart Actions */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
              
              {/* Header Cart Button */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-stone-900/20 transition-all font-display cursor-pointer group"
                title="View Shopping Cart"
              >
                <ShoppingBag className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
                <span>Cart</span>
                {totalCartItems > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold animate-in zoom-in-50">
                    {totalCartItems}
                  </span>
                )}
              </button>

              {store.phone && (
                <button
                  type="button"
                  onClick={() => handleWhatsAppInquiry()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all font-display cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">WhatsApp Shop</span>
                  <span className="sm:hidden">WhatsApp</span>
                </button>
              )}

              {store.phone && (
                <a
                  href={`tel:${store.phone.replace(/[^0-9+]/g, '')}`}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-stone-500" />
                  <span className="hidden sm:inline">{store.phone}</span>
                  <span className="sm:hidden">Call</span>
                </a>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Catalog Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Search & Filter Control Card */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-xs space-y-4">
          
          {/* Top Row: Search Input & Sort Dropdown */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, barcode, or category..."
                className="w-full pl-10 pr-10 py-2.5 bg-stone-50 hover:bg-stone-100/60 focus:bg-white rounded-2xl border border-stone-200 text-sm font-medium focus:outline-hidden focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 p-0.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort & In-Stock Switch */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
              {/* In Stock Toggle */}
              <button
                type="button"
                onClick={() => setInStockOnly(!inStockOnly)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                  inStockOnly
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${inStockOnly ? 'text-emerald-600' : 'text-stone-400'}`} />
                <span>In Stock Only</span>
              </button>

              {/* Sort By Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="pl-3.5 pr-8 py-2.5 bg-white rounded-2xl border border-stone-200 text-xs font-semibold text-stone-700 focus:outline-hidden focus:border-rose-500 appearance-none shadow-2xs cursor-pointer"
                >
                  <option value="featured">Featured Order</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Name (A-Z)</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Category Tabs / Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-2xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Items</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'All' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'
              }`}>
                {products.length}
              </span>
            </button>

            {categories.map((cat) => {
              const count = products.filter((p) => p.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-2xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Results Counter & Active Filter Badge */}
        <div className="flex items-center justify-between text-xs text-stone-500 px-1">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-stone-900">{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'gift item' : 'gift items'}</span>
            {selectedCategory !== 'All' && (
              <span className="bg-pink-50 text-pink-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                in {selectedCategory}
              </span>
            )}
            {inStockOnly && (
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                In Stock Only
              </span>
            )}
          </div>

          {(searchQuery || selectedCategory !== 'All' || inStockOnly) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setInStockOnly(false);
              }}
              className="text-pink-600 hover:text-pink-700 font-semibold underline text-xs cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-4 border border-stone-200/80 shadow-xs animate-pulse space-y-3">
                <div className="w-full aspect-square bg-stone-200 rounded-2xl" />
                <div className="h-4 bg-stone-200 rounded-md w-3/4" />
                <div className="h-3 bg-stone-200 rounded-md w-1/2" />
                <div className="pt-2 flex justify-between items-center">
                  <div className="h-5 bg-stone-200 rounded-md w-1/3" />
                  <div className="h-5 bg-stone-200 rounded-md w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl p-12 border border-stone-200/80 text-center space-y-4 max-w-md mx-auto my-8">
            <div className="w-16 h-16 rounded-3xl bg-pink-50 text-pink-500 flex items-center justify-center mx-auto">
              <Gift className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-lg font-display">No gift items found</h3>
              <p className="text-xs text-stone-500 mt-1">
                We couldn&apos;t find any products matching your current search or category filters.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setInStockOnly(false);
              }}
              className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/25 transition-all font-display cursor-pointer"
            >
              View Full Collection
            </button>
          </div>
        ) : (
          /* Product Grid with Multi-Photo Slider */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => {
              const inCartItem = cart.find((item) => item.product.id === product.id);

              return (
                <CatalogProductCard
                  key={product.id}
                  product={product}
                  inCartItem={inCartItem}
                  currencySymbol={store.currencySymbol || 'Rs.'}
                  onOpenQuickView={handleOpenQuickView}
                  onAddToCart={addToCart}
                  onWhatsAppInquiry={handleWhatsAppInquiry}
                />
              );
            })}
          </div>
        )}

      </main>

      {/* Floating Cart Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="relative flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-stone-900 hover:bg-stone-800 active:scale-95 text-white font-bold shadow-2xl shadow-stone-900/50 border border-stone-700 hover:border-pink-500/40 transition-all duration-200 cursor-pointer font-display group"
          aria-label="Open Shopping Cart"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform" />
            {totalCartItems > 0 && (
              <span className="absolute -top-2.5 -right-2.5 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-md animate-bounce">
                {totalCartItems}
              </span>
            )}
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs font-bold text-white tracking-wide">
              {totalCartItems > 0 ? `${totalCartItems} ${totalCartItems === 1 ? 'item' : 'items'}` : 'View Cart'}
            </span>
            {totalCartItems > 0 && (
              <span className="text-[11px] text-pink-300 font-mono font-bold">
                LKR {cartGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Quick Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-22 right-6 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-stone-900/95 text-white text-xs px-4 py-2.5 rounded-2xl shadow-xl border border-stone-700 backdrop-blur-md flex items-center gap-3 font-display">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold">{toastMessage}</span>
            <button
              type="button"
              onClick={() => {
                setToastMessage(null);
                setIsCartOpen(true);
              }}
              className="text-pink-400 hover:text-pink-300 font-bold underline text-xs cursor-pointer ml-1"
            >
              View Cart
            </button>
          </div>
        </div>
      )}

      {/* Product Quick View Modal with Multi-Image Carousel & Thumbnail Selector */}
      <CatalogQuickViewModal
        product={selectedProduct}
        initialIndex={initialModalPhotoIndex}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
        onWhatsAppInquiry={handleWhatsAppInquiry}
        currencySymbol={store.currencySymbol || 'Rs.'}
      />

      {/* Cart Drawer Component */}
      <CatalogCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        store={store}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-stone-900 text-sm font-display">{store.shopName}</p>
                <p className="text-xs text-stone-500">{store.shopTagline}</p>
              </div>
            </div>

            <div className="text-xs text-stone-500 space-y-0.5">
              {store.address && (
                <div className="flex items-center justify-center md:justify-end gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{store.address}</span>
                </div>
              )}
              {store.phone && (
                <div className="flex items-center justify-center md:justify-end gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span>{store.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-400">
            <p>© {new Date().getFullYear()} {store.shopName}. All rights reserved.</p>
            <p>Digital Product Catalog powered by Tharu Gift Hub POS</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
