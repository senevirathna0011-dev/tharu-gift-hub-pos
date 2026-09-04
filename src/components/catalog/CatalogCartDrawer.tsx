'use client';

import React, { useEffect } from 'react';
import { CatalogCartItem } from '@/lib/types';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  MessageCircle, 
  Barcode, 
  Gift, 
  ArrowRight
} from 'lucide-react';

interface StoreInfo {
  shopName: string;
  shopTagline: string;
  address: string;
  phone: string;
  email: string;
  currencySymbol: string;
}

interface CatalogCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CatalogCartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  store: StoreInfo;
}

export default function CatalogCartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  store,
}: CatalogCartDrawerProps) {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Format currency helpers for LKR
  const formatLKR = (val: number) => {
    return val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const grandTotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);

  // Send Order via WhatsApp
  const handleSendWhatsAppOrder = () => {
    if (cart.length === 0) return;

    const phoneClean = store.phone ? store.phone.replace(/[^0-9+]/g, '') : '';
    const shopTitle = store.shopName || 'Tharu Gift Hub';

    const itemsText = cart
      .map((item, index) => {
        const itemNumber = index + 1;
        const name = item.product.name;
        const barcode = item.product.sku || 'N/A';
        const qty = item.quantity;
        const price = formatLKR(item.product.sellingPrice);
        const subtotal = formatLKR(item.product.sellingPrice * item.quantity);

        return `${itemNumber}. ${name}\n   🏷️ Barcode: ${barcode}\n   🔢 Qty: ${qty} x LKR ${price} = LKR ${subtotal}`;
      })
      .join('\n\n');

    const totalText = formatLKR(grandTotal);

    const message = `🛒 *New Order - ${shopTitle} Catalog*
-----------------------------------
${itemsText}

-----------------------------------
💰 *Grand Total: LKR ${totalText}*

Please process my order!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = phoneClean
      ? `https://wa.me/${phoneClean}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center font-bold text-sm">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base tracking-tight font-display text-white">
                    Shopping Cart
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-bold">
                    {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Review your gift items & checkout via WhatsApp
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={onClearCart}
                  className="p-2 text-stone-400 hover:text-rose-400 hover:bg-stone-800 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="Clear entire cart"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
                title="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Body / Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#FAF8F5]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
                <div className="w-20 h-20 rounded-3xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-500 shadow-sm">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <h3 className="font-bold text-stone-800 text-lg font-display">Your cart is empty</h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Explore our curated collection of gifts, keepsakes, and bouquets and add them to your cart.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/25 transition-all font-display flex items-center gap-2 cursor-pointer"
                >
                  <Gift className="w-4 h-4" />
                  <span>Start Browsing Catalog</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => {
                  const itemSubtotal = item.product.sellingPrice * item.quantity;

                  return (
                    <div
                      key={item.product.id}
                      className="bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-2xs hover:border-pink-200 transition-all flex flex-col gap-3 group"
                    >
                      {/* Top Row: Thumbnail + Name + Barcode + Delete */}
                      <div className="flex items-start gap-3">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-xl bg-stone-100 overflow-hidden shrink-0 flex items-center justify-center border border-stone-100">
                          {(item.product.image || item.product.images?.[0]) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={(item.product.image || item.product.images?.[0])!}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Gift className="w-7 h-7 text-pink-300" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-2 leading-tight font-display">
                              {item.product.name}
                            </h4>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.product.id)}
                              className="p-1 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Barcode Tag */}
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-700 text-[10px] font-mono font-medium">
                              <Barcode className="w-3 h-3 text-stone-400" />
                              <span>{item.product.sku || 'N/A'}</span>
                            </span>
                            <span className="text-[10px] text-stone-500 font-medium">
                              {item.product.category}
                            </span>
                          </div>

                          {/* Unit Price */}
                          <div className="mt-1 text-xs text-stone-600 font-mono">
                            LKR {formatLKR(item.product.sellingPrice)} each
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Quantity Selector & Subtotal Calculation */}
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/80">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-lg bg-white text-stone-700 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-colors shadow-2xs font-bold cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <span className="w-8 text-center text-xs font-bold font-mono text-stone-900">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-lg bg-white text-stone-700 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-colors shadow-2xs font-bold cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Subtotal */}
                        <div className="text-right">
                          <span className="text-[10px] text-stone-400 block font-medium">Subtotal</span>
                          <span className="text-xs sm:text-sm font-black text-stone-900 font-mono">
                            LKR {formatLKR(itemSubtotal)}
                          </span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Drawer Footer & Checkout Action */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 bg-white border-t border-stone-200 space-y-4 shadow-lg">
              
              {/* Grand Total Breakdown */}
              <div className="space-y-2 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
                <div className="flex justify-between text-xs text-stone-500">
                  <span>Total Items</span>
                  <span className="font-mono font-bold text-stone-800">{totalItemsCount} pcs</span>
                </div>
                <div className="flex justify-between items-baseline pt-1.5 border-t border-stone-200">
                  <span className="text-sm font-bold text-stone-900 font-display">
                    Grand Total
                  </span>
                  <div className="text-right">
                    <span className="text-lg sm:text-xl font-black text-rose-600 font-mono">
                      LKR {formatLKR(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order via WhatsApp Button */}
              <button
                type="button"
                onClick={handleSendWhatsAppOrder}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all font-display group cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Send Order via WhatsApp</span>
                <ArrowRight className="w-4 h-4 ml-1 opacity-80 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="text-center">
                <p className="text-[11px] text-stone-400">
                  Orders will be sent directly to <strong className="text-stone-600 font-semibold">{store.shopName}</strong> on WhatsApp for prompt processing & delivery confirmation.
                </p>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
