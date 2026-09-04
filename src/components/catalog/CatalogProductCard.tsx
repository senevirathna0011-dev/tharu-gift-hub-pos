'use client';

import React, { useState } from 'react';
import { CatalogProduct, CatalogCartItem } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { 
  Gift, 
  PackageX, 
  MessageCircle, 
  ShoppingBag, 
  Check, 
  Barcode, 
  ChevronLeft, 
  ChevronRight, 
  Images,
  Eye
} from 'lucide-react';

interface CatalogProductCardProps {
  product: CatalogProduct;
  inCartItem?: CatalogCartItem;
  currencySymbol: string;
  onOpenQuickView: (product: CatalogProduct, initialIndex?: number) => void;
  onAddToCart: (product: CatalogProduct, quantity?: number) => void;
  onWhatsAppInquiry: (product: CatalogProduct) => void;
}

export default function CatalogProductCard({
  product,
  inCartItem,
  currencySymbol,
  onOpenQuickView,
  onAddToCart,
  onWhatsAppInquiry,
}: CatalogProductCardProps) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Normalize photos list
  const photos = (product.images && product.images.length > 0)
    ? product.images
    : (product.image ? [product.image] : []);

  const hasMultiplePhotos = photos.length > 1;
  const currentPhoto = photos[activePhotoIdx] || product.image || null;

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIdx((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIdx((prev) => (prev + 1) % photos.length);
  };

  const handleSelectDot = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    setActivePhotoIdx(idx);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white rounded-3xl border border-stone-200/80 shadow-xs hover:shadow-xl hover:border-pink-200 transition-all duration-300 flex flex-col overflow-hidden group"
    >
      {/* Product Image Carousel Container */}
      <div 
        onClick={() => onOpenQuickView(product, activePhotoIdx)}
        className="relative w-full aspect-square bg-stone-100 overflow-hidden cursor-pointer flex items-center justify-center select-none"
      >
        {currentPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentPhoto}
            alt={`${product.name} photo ${activePhotoIdx + 1}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-stone-300">
            <Gift className="w-12 h-12 text-pink-300 mb-1" />
            <span className="text-[11px] font-semibold text-stone-400 font-display">Tharu Gift Hub</span>
          </div>
        )}

        {/* Carousel Arrow Navigation Buttons (when multiple photos) */}
        {hasMultiplePhotos && (
          <>
            <button
              type="button"
              onClick={handlePrevPhoto}
              className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs flex items-center justify-center transition-all duration-200 shadow-md z-20 cursor-pointer ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90 sm:opacity-0 sm:group-hover:opacity-100'
              }`}
              title="Previous photo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleNextPhoto}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs flex items-center justify-center transition-all duration-200 shadow-md z-20 cursor-pointer ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90 sm:opacity-0 sm:group-hover:opacity-100'
              }`}
              title="Next photo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Bottom Dots Indicator */}
            <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-1.5 z-20 pointer-events-auto">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-xs">
                {photos.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => handleSelectDot(e, idx)}
                    className={`transition-all rounded-full cursor-pointer ${
                      activePhotoIdx === idx
                        ? 'w-3.5 h-1.5 bg-white shadow-xs'
                        : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                    }`}
                    title={`View photo ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Photo Count Pill (Top Right or Bottom Left) */}
        {hasMultiplePhotos && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono font-bold shadow-xs">
              <Images className="w-3 h-3 text-pink-300" />
              <span>{activePhotoIdx + 1}/{photos.length}</span>
            </span>
          </div>
        )}

        {/* Stock Status Badge (Top Right) */}
        <div className="absolute top-3 right-3 z-10">
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

        {/* Category Pill (Bottom Left when no multiple photos badge, or shifted) */}
        <div className={`absolute z-10 ${hasMultiplePhotos ? 'bottom-8 left-3' : 'bottom-3 left-3'}`}>
          <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold">
            {product.category}
          </span>
        </div>

        {/* In Cart Indicator (Top Left overlay if item is already in cart) */}
        {inCartItem && (
          <div className={`absolute z-15 animate-in fade-in zoom-in-75 ${hasMultiplePhotos ? 'top-9 left-3' : 'top-3 left-3'}`}>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold shadow-md">
              <Check className="w-3 h-3" />
              <span>{inCartItem.quantity} in cart</span>
            </span>
          </div>
        )}

        {/* Quick View Hover Peek Pill */}
        <div className="absolute inset-0 bg-stone-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-stone-900 text-xs font-bold shadow-lg border border-stone-200 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 font-display">
            <Eye className="w-3.5 h-3.5 text-rose-500" />
            <span>Quick View</span>
          </span>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Product Name */}
          <h3 
            onClick={() => onOpenQuickView(product, activePhotoIdx)}
            className="font-bold text-stone-900 text-sm sm:text-base leading-snug group-hover:text-rose-600 transition-colors line-clamp-2 cursor-pointer font-display"
          >
            {product.name}
          </h3>

          {/* Barcode if available */}
          {product.sku && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-stone-400 font-mono">
              <Barcode className="w-3 h-3 text-stone-400" />
              <span>{product.sku}</span>
            </div>
          )}

          {/* Description / Gift Notes */}
          {product.description && (
            <p className="text-xs text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Price and Cart Actions */}
        <div className="pt-3 border-t border-stone-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                Price
              </span>
              <div className="text-base sm:text-lg font-black text-stone-900 font-mono">
                {formatCurrency(product.sellingPrice, currencySymbol)}
              </div>
            </div>

            {/* WhatsApp Direct Inquire */}
            <button
              type="button"
              onClick={() => onWhatsAppInquiry(product)}
              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 transition-all shadow-2xs cursor-pointer"
              title="Quick inquiry on WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          {product.inStock ? (
            <button
              type="button"
              onClick={() => onAddToCart(product, 1)}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer font-display ${
                inCartItem
                  ? 'bg-stone-900 hover:bg-stone-800 text-white shadow-stone-900/10'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25 active:scale-[0.98]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{inCartItem ? 'Add More to Cart' : 'Add to Cart'}</span>
              {inCartItem && (
                <span className="ml-1 px-1.5 py-0.2 bg-white/20 rounded-full text-[10px] font-mono font-bold">
                  +{inCartItem.quantity}
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-stone-100 text-stone-400 text-xs font-semibold cursor-not-allowed"
            >
              <PackageX className="w-3.5 h-3.5" />
              <span>Out of Stock</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
