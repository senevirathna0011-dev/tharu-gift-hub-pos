'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useSettings } from '@/context/SettingsContext';
import { useToast } from '@/components/ui/Toast';
import { 
  X, 
  Copy, 
  Check, 
  QrCode, 
  Share2, 
  Download, 
  Printer, 
  ExternalLink,
  MessageCircle,
  Gift,
  Sparkles,
  Smartphone
} from 'lucide-react';

interface ShareCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareCatalogModal({ isOpen, onClose }: ShareCatalogModalProps) {
  const { settings } = useSettings();
  const { toast } = useToast();

  const [catalogUrl, setCatalogUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCatalogUrl(`${window.location.origin}/catalog`);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    if (!catalogUrl) return;
    try {
      await navigator.clipboard.writeText(catalogUrl);
      setCopied(true);
      toast('Catalog link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast('Failed to copy link', 'error');
    }
  };

  const handleWhatsAppShare = () => {
    const shopName = settings.shopName || 'Tharu Gift Hub';
    const text = encodeURIComponent(
      `Hello! 🎁 Explore our online digital gift catalog & current collection from ${shopName}:\n${catalogUrl}`
    );
    window.open(`https://web.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) {
      toast('Unable to export QR code', 'error');
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const DOMURL = window.URL || window.webkitURL || window;
    const url = DOMURL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 4; // High resolution
      canvas.width = 300 * scale;
      canvas.height = 300 * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${(settings.shopName || 'store').toLowerCase().replace(/\s+/g, '-')}-catalog-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        toast('QR Code downloaded successfully!', 'success');
      }
      DOMURL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast('Please allow popups to print QR standee', 'error');
      return;
    }

    const svgHtml = qrRef.current?.innerHTML || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Catalog QR - ${settings.shopName}</title>
          <style>
            @page { size: auto; margin: 15mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #1c1917;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              margin: 0;
              background-color: #ffffff;
            }
            .card {
              border: 2px dashed #e11d48;
              border-radius: 24px;
              padding: 40px;
              text-align: center;
              max-width: 400px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            }
            .badge {
              display: inline-block;
              background-color: #ffe4e6;
              color: #e11d48;
              font-weight: 700;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
              padding: 6px 14px;
              border-radius: 9999px;
              margin-bottom: 16px;
            }
            h1 {
              font-size: 24px;
              margin: 0 0 6px 0;
              color: #0c0a09;
            }
            p.tagline {
              font-size: 13px;
              color: #78716c;
              margin: 0 0 24px 0;
            }
            .qr-box {
              background: #ffffff;
              padding: 16px;
              border-radius: 16px;
              display: inline-block;
              box-shadow: 0 2px 8px rgba(0,0,0,0.08);
              border: 1px solid #e7e5e4;
              margin-bottom: 20px;
            }
            .qr-box svg {
              display: block;
              width: 220px !important;
              height: 220px !important;
            }
            .instructions {
              font-size: 14px;
              font-weight: 600;
              color: #292524;
              margin: 0 0 6px 0;
            }
            .url {
              font-size: 11px;
              font-family: monospace;
              color: #e11d48;
              word-break: break-all;
            }
            .footer {
              margin-top: 24px;
              font-size: 11px;
              color: #a8a29e;
              border-top: 1px solid #f5f5f4;
              padding-top: 12px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">Scan & Browse</div>
            <h1>${settings.shopName || 'Tharu Gift Hub'}</h1>
            <p class="tagline">${settings.shopTagline || 'Curated Gifts & Keepsakes'}</p>
            
            <div class="qr-box">
              ${svgHtml}
            </div>

            <p class="instructions">📱 Scan with your camera to view our live catalog & pricing!</p>
            <p class="url">${catalogUrl}</p>
            
            <div class="footer">
              ${settings.address ? `${settings.address} • ` : ''}${settings.phone || ''}
            </div>
          </div>
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base font-display flex items-center gap-1.5">
                <span>Share Online Digital Catalog</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  Live
                </span>
              </h3>
              <p className="text-xs text-stone-500">
                Share your catalog link or place this QR code at checkout for customers to scan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          
          {/* QR Code Presentation Box */}
          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-rose-50/50 to-pink-50/30 rounded-2xl border border-pink-100 text-center">
            
            {/* QR Card Container */}
            <div 
              ref={qrRef}
              className="p-4 bg-white rounded-2xl shadow-md border border-stone-200/80 mb-3 flex items-center justify-center"
            >
              <QRCodeSVG
                value={catalogUrl || 'https://localhost:3000/catalog'}
                size={180}
                level="H"
                includeMargin={true}
                fgColor="#1c1917"
                bgColor="#ffffff"
              />
            </div>

            <div className="flex items-center gap-1.5 text-stone-900 font-bold text-sm font-display">
              <Smartphone className="w-4 h-4 text-pink-600" />
              <span>Scan with mobile camera to view catalog</span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5 max-w-xs">
              No app needed. Customers can instantly view your product list, photos, categories, and LKR prices.
            </p>

            {/* Print & Download Action Buttons */}
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadQR}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-semibold shadow-2xs transition-all hover:border-stone-300"
              >
                <Download className="w-3.5 h-3.5 text-stone-500" />
                <span>Save PNG</span>
              </button>

              <button
                type="button"
                onClick={handlePrintQR}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-semibold shadow-2xs transition-all hover:border-stone-300"
              >
                <Printer className="w-3.5 h-3.5 text-stone-500" />
                <span>Print Counter Standee</span>
              </button>
            </div>
          </div>

          {/* Copy Link Input Section */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Public Catalog Link
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  readOnly
                  value={catalogUrl}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs font-mono text-stone-700 select-all focus:outline-hidden"
                />
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-emerald-600/25'
                    : 'bg-stone-900 hover:bg-stone-800 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Direct Share Options */}
          <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all font-display"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Share via WhatsApp</span>
            </button>

            <a
              href="/catalog"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors"
            >
              <span>Preview Catalog</span>
              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
