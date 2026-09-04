'use client';

import React from 'react';
import { Product } from '@/lib/types';
import { useSettings } from '@/context/SettingsContext';
import { 
  Sparkles, 
  AlertTriangle, 
  Plus, 
  PackageX, 
  Gift,
  Heart,
  Flame,
  Coffee,
  Sun,
  Smile
} from 'lucide-react';

interface ProductCatalogProps {
  products: Product[];
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onAddToCart: (product: Product) => void;
  isLoading?: boolean;
}

export default function ProductCatalog({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  onAddToCart,
  isLoading = false,
}: ProductCatalogProps) {
  const { formatMoney } = useSettings();

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'greeting cards':
        return <Heart className="w-3.5 h-3.5" />;
      case 'toys & plush':
        return <Smile className="w-3.5 h-3.5" />;
      case 'candles & fragrance':
        return <Flame className="w-3.5 h-3.5" />;
      case 'mugs & drinkware':
        return <Coffee className="w-3.5 h-3.5" />;
      case 'home decor':
        return <Sun className="w-3.5 h-3.5" />;
      default:
        return <Gift className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => onSelectCategory('All')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategory === 'All'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 hover:text-stone-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>All Items ({products.length})</span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              {getCategoryIcon(cat)}
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 py-8">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 border border-stone-200/80 animate-pulse space-y-3"
            >
              <div className="w-full h-32 bg-stone-200 rounded-xl" />
              <div className="h-4 bg-stone-200 rounded w-3/4" />
              <div className="h-3 bg-stone-200 rounded w-1/2" />
              <div className="h-5 bg-stone-200 rounded w-1/3 pt-2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-stone-200 text-center">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
            <Gift className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-stone-800 font-display">No gift items found</h4>
          <p className="text-xs text-stone-500 max-w-sm mt-1">
            Try adjusting your search keywords or select another gift category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 overflow-y-auto pr-1 pb-6">
          {products.map((product) => {
            const isOutOfStock = product.stockQuantity <= 0;
            const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.minStockAlert;

            return (
              <button
                key={product.id}
                onClick={() => !isOutOfStock && onAddToCart(product)}
                disabled={isOutOfStock}
                className={`group relative flex flex-col bg-white rounded-2xl p-3 border text-left transition-all duration-200 ${
                  isOutOfStock
                    ? 'opacity-60 cursor-not-allowed border-stone-200 bg-stone-50/50'
                    : 'hover:shadow-md hover:border-rose-300 hover:-translate-y-0.5 border-stone-200'
                }`}
              >
                {/* Product Image / Visual Box */}
                <div className="relative w-full h-32 rounded-xl overflow-hidden bg-stone-100 mb-2.5 flex items-center justify-center">
                  {(product.image || product.imageUrl || product.images?.[0]) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={(product.image || product.imageUrl || product.images?.[0])!}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-stone-400">
                      <Gift className="w-8 h-8 text-pink-300" />
                      <span className="text-[10px] mt-1 font-mono">{product.sku}</span>
                    </div>
                  )}

                  {/* Stock Status Badge */}
                  <div className="absolute top-2 right-2">
                    {isOutOfStock ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-900/85 text-white text-[10px] font-bold backdrop-blur-xs">
                        <PackageX className="w-3 h-3 text-rose-400" />
                        Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold shadow-xs">
                        <AlertTriangle className="w-3 h-3" />
                        {product.stockQuantity} Left
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-semibold backdrop-blur-xs">
                        {product.stockQuantity} in stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono mb-0.5">
                      <span>{product.sku}</span>
                      <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded">
                        {product.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-stone-900 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-rose-600 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-sm sm:text-base font-bold text-stone-900 font-display">
                      {formatMoney(product.sellingPrice)}
                    </span>
                    {!isOutOfStock && (
                      <span className="w-7 h-7 rounded-lg bg-pink-50 group-hover:bg-rose-600 text-rose-600 group-hover:text-white flex items-center justify-center transition-colors shadow-xs">
                        <Plus className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
