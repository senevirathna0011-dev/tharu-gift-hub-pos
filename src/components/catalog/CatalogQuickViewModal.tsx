'use client';

import React, { useState, useEffect } from 'react';
import { CatalogProduct } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Gift, 
  CheckCircle2, 
  PackageX, 
  Barcode, 
  Minus, 
  Plus, 
  ShoppingBag, 
  MessageCircle, 
  Images,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface CatalogQuickViewModalProps {
  product: CatalogProduct | null;
  initialIndex?: number;
  onClose: () => void;
  onAddToCart: (product: CatalogProduct, quantity: number) => void;
  onWhatsAppInquiry: (product: CatalogProduct) => void;
  currencySymbol: string;
}

export default function CatalogQuickViewModal({
  product,
  initialIndex = 0,
  onClose,
  onAddToCart,
  onWhatsAppInquiry,
  currencySymbol,
}: CatalogQuickViewModalProps) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(initialIndex);
  const [modalQty, setModalQty] = useState<number>(1);

  // Sync initial index when modal opens with a different product or photo index
  useEffect(() => {
    setActivePhotoIdx(initialIndex);
    setModalQty(1);
  }, [product, initialIndex]);

  // Keyboard navigation for carousel and closing
  useEffect(() => {
    if (!product) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        const photos = (product.images && product.images.length > 0)
          ? product.images
          : (product.image ? [product.image] : []);
        if (photos.length > 1) {
          setActivePhotoIdx((prev) => (prev - 1 + photos.length) % photos.length);
        }
      } else if (e.key === 'ArrowRight') {
        const photos = (product.images && product.images.length > 0)
          ? product.images
          : (product.image ? [product.image] : []);
        if (photos.length > 1) {
          setActivePhotoIdx((prev) => (prev + 1) % photos.length);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const photos = (product.images && product.images.length > 0)
    ? product.images
    : (product.image ? [product.image] : []);

  const hasMultiplePhotos = photos.length > 1;
  const currentPhoto = photos[activePhotoIdx] || product.image || null;

  const handlePrevPhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActivePhotoIdx((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleNextPhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActivePhotoIdx((prev) => (prev + 1) % photos.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Main Hero Image & Carousel */}
        <div className="relative w-full aspect-video sm:aspect-4/3 bg-stone-100 flex items-center justify-center overflow-hidden select-none">
          {currentPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentPhoto}
              alt={`${product.name} photo ${activePhotoIdx + 1}`}
              className="w-full h-full object-cover transition-all duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-stone-300">
              <Gift className="w-16 h-16 text-pink-300 mb-2" />
              <span className="text-xs font-semibold text-stone-400 font-display">Tharu Gift Hub</span>
            </div>
          )}

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-xs cursor-pointer z-20"
            title="Close modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Category Tag (Bottom Left) */}
          <div className="absolute bottom-3 left-3 z-10">
            <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-xs font-semibold">
              {product.category}
            </span>
          </div>

          {/* Photo Counter Badge */}
          {hasMultiplePhotos && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-xs font-mono font-bold shadow-sm">
                <Images className="w-3.5 h-3.5 text-pink-300" />
                <span>Photo {activePhotoIdx + 1} of {photos.length}</span>
              </span>
            </div>
          )}

          {/* Carousel Arrows */}
          {hasMultiplePhotos && (
            <>
              <button
                type="button"
                onClick={handlePrevPhoto}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 hover:bg-black/75 text-white backdrop-blur-xs flex items-center justify-center transition-all duration-200 shadow-lg cursor-pointer z-20 group"
                title="Previous photo (Left arrow)"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={handleNextPhoto}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 hover:bg-black/75 text-white backdrop-blur-xs flex items-center justify-center transition-all duration-200 shadow-lg cursor-pointer z-20 group"
                title="Next photo (Right arrow)"
              >
                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Filmstrip Selector (when product has 2 to 5 photos) */}
        {hasMultiplePhotos && (
          <div className="px-6 pt-3 pb-1 bg-stone-50 border-b border-stone-100 flex items-center gap-2.5 overflow-x-auto">
            {photos.map((thumbUrl, idx) => {
              const isActive = activePhotoIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    isActive
                      ? 'border-rose-500 ring-2 ring-rose-500/25 scale-105 shadow-sm'
                      : 'border-stone-200 hover:border-stone-400 opacity-70 hover:opacity-100'
                  }`}
                  title={`View photo ${idx + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {isActive && (
                    <div className="absolute inset-0 bg-rose-500/10 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Modal Info & Cart Section */}
        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-bold text-stone-900 font-display">
                {product.name}
              </h2>
              <div className="shrink-0 pt-0.5">
                {product.inStock ? (
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

            {/* Barcode & Warranty */}
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              {product.sku && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-700 text-[11px] font-mono font-medium">
                  <Barcode className="w-3.5 h-3.5 text-stone-400" />
                  <span>{product.sku}</span>
                </span>
              )}
              {product.warranty && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200/70">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{product.warranty} Warranty</span>
                </span>
              )}
            </div>

            <div className="text-2xl font-black text-rose-600 font-mono mt-2">
              {formatCurrency(product.sellingPrice, currencySymbol)}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                Product Description
              </span>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Quantity Selector & Add to Cart (If in stock) */}
          {product.inStock && (
            <div className="p-4 bg-pink-50/50 rounded-2xl border border-pink-100 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-stone-700 font-display">
                Quantity:
              </span>
              <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-stone-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                  className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-rose-100 hover:text-rose-600 text-stone-700 flex items-center justify-center transition-colors font-bold cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-bold font-mono text-stone-900">
                  {modalQty}
                </span>
                <button
                  type="button"
                  onClick={() => setModalQty(modalQty + 1)}
                  className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-rose-100 hover:text-rose-600 text-stone-700 flex items-center justify-center transition-colors font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-400 block font-medium">Subtotal</span>
                <span className="text-sm font-black text-rose-600 font-mono">
                  {formatCurrency(product.sellingPrice * modalQty, currencySymbol)}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            {product.inStock && (
              <button
                type="button"
                onClick={() => {
                  onAddToCart(product, modalQty);
                  onClose();
                }}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-600/25 transition-all font-display cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onWhatsAppInquiry(product)}
              className={`w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition-all font-display cursor-pointer ${
                !product.inStock ? 'w-full' : ''
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Inquire on WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-3 rounded-2xl border border-stone-200 hover:bg-stone-100 text-stone-600 font-semibold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
