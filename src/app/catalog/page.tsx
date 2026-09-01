'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CatalogProduct } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { 
  Search, 
  Gift, 
  Sparkles, 
  CheckCircle2, 
  PackageX, 
  MessageCircle, 
  Phone, 
  MapPin, 
  Layers, 
  SlidersHorizontal,
  X,
  ExternalLink,
  ArrowUpDown,
  ShoppingBag,
  Info
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
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);

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

  // Helper for WhatsApp inquiry
  const handleWhatsAppInquiry = (product?: CatalogProduct) => {
    const phoneClean = store.phone.replace(/[^0-9+]/g, '');
    let text = '';
    if (product) {
      const priceStr = formatCurrency(product.sellingPrice, store.currencySymbol || 'Rs.');
      text = encodeURIComponent(
        `Hello ${store.shopName}! 🎁 I am interested in purchasing "${product.name}" (${priceStr}) from your online catalog. Is this currently available for pickup or delivery?`
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

  const currencySymbol = store.currencySymbol || 'Rs.';

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans selection:bg-pink-100 selection:text-pink-900">
      
      {/* Top Boutique Announcement Bar */}
      <div className="bg-stone-900 text-stone-200 text-xs py-2 px-4 text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />
        <span>Welcome to our Digital Gift Catalog. Scan, browse & inquire online!</span>
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

            {/* Quick Contact Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              {store.phone && (
                <button
                  onClick={() => handleWhatsAppInquiry()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all font-display"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Shop</span>
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
                placeholder="Search products by name or category..."
                className="w-full pl-10 pr-10 py-2.5 bg-stone-50 hover:bg-stone-100/60 focus:bg-white rounded-2xl border border-stone-200 text-sm font-medium focus:outline-hidden focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 p-0.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200"
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
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border text-xs font-semibold transition-all ${
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
              className={`px-4 py-2 rounded-2xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
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
                  className={`px-4 py-2 rounded-2xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
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
              className="text-pink-600 hover:text-pink-700 font-semibold underline text-xs"
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
              className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/25 transition-all font-display"
            >
              View Full Collection
            </button>
          </div>
        ) : (
          /* Product Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => {
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-xl hover:border-pink-200 transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  {/* Product Image Container */}
                  <div 
                    onClick={() => setSelectedProduct(product)}
                    className="relative w-full aspect-square bg-stone-100 overflow-hidden cursor-pointer flex items-center justify-center"
                  >
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-stone-300">
                        <Gift className="w-12 h-12 text-pink-300 mb-1" />
                        <span className="text-[11px] font-semibold text-stone-400 font-display">Tharu Gift Hub</span>
                      </div>
                    )}

                    {/* Stock Status Badge (Top Right) */}
                    <div className="absolute top-3 right-3">
                      {product.inStock ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-emerald-700 text-[10px] font-bold shadow-sm border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>In Stock</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-stone-600 text-[10px] font-bold shadow-sm border border-stone-200">
                          <PackageX className="w-3 h-3 text-stone-400" />
                          <span>Out of Stock</span>
                        </span>
                      )}
                    </div>

                    {/* Category Pill (Bottom Left) */}
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    
                    <div>
                      {/* Product Name */}
                      <h3 
                        onClick={() => setSelectedProduct(product)}
                        className="font-bold text-stone-900 text-sm sm:text-base leading-snug group-hover:text-rose-600 transition-colors line-clamp-2 cursor-pointer font-display"
                      >
                        {product.name}
                      </h3>

                      {/* Description / Gift Notes */}
                      {product.description && (
                        <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Price and WhatsApp Action */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                          Price
                        </span>
                        <div className="text-base sm:text-lg font-black text-stone-900 font-mono">
                          {formatCurrency(product.sellingPrice, currencySymbol)}
                        </div>
                      </div>

                      {/* WhatsApp Inquiry Button */}
                      <button
                        type="button"
                        onClick={() => handleWhatsAppInquiry(product)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 text-xs font-bold transition-all shadow-2xs"
                        title="Inquire about this product on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Inquire</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Product Quick View Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Image */}
            <div className="relative w-full aspect-video sm:aspect-4/3 bg-stone-100 flex items-center justify-center overflow-hidden">
              {selectedProduct.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-stone-300">
                  <Gift className="w-16 h-16 text-pink-300 mb-2" />
                  <span className="text-xs font-semibold text-stone-400 font-display">Tharu Gift Hub</span>
                </div>
              )}

              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-xs"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-3 left-3">
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-xs font-semibold">
                  {selectedProduct.category}
                </span>
              </div>
            </div>

            {/* Modal Info */}
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xl font-bold text-stone-900 font-display">
                    {selectedProduct.name}
                  </h2>
                  <div className="shrink-0">
                    {selectedProduct.inStock ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>In Stock</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-semibold">
                        <PackageX className="w-3.5 h-3.5 text-stone-400" />
                        <span>Out of Stock</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-2xl font-black text-rose-600 font-mono mt-2">
                  {formatCurrency(selectedProduct.sellingPrice, currencySymbol)}
                </div>
              </div>

              {selectedProduct.description && (
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                    Product Description
                  </span>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                    {selectedProduct.description}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleWhatsAppInquiry(selectedProduct)}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition-all font-display"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Inquire on WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-3 rounded-2xl border border-stone-200 hover:bg-stone-100 text-stone-600 font-semibold text-xs transition-colors"
                >
                  Close
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

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
