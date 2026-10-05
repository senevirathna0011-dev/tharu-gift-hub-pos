'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, Supplier } from '@/lib/types';
import { generateSKU } from '@/lib/formatters';
import { 
  X, 
  Sparkles, 
  Barcode, 
  Tag, 
  Layers, 
  Image as ImageIcon, 
  UploadCloud, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Link as LinkIcon,
  Building2,
  Globe,
  Plus,
  ArrowLeft,
  ArrowRight,
  Star,
  ShieldCheck
} from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => Promise<boolean>;
  initialProduct?: Product | null;
}

const CATEGORY_OPTIONS = [
  'Toys & Plush',
  'Greeting Cards',
  'Personalized Gifts',
  'Candles & Fragrance',
  'Mugs & Drinkware',
  'Home Decor',
  'Gift Wrap & Boxes',
  'Confections & Sweets',
  'Jewelry & Keepsakes',
  'Stationery & Journals',
];

const WARRANTY_PRESETS = [
  'No Warranty',
  '1 Month',
  '3 Months',
  '6 Months',
  '1 Year',
  '2 Years',
];

const MAX_PHOTOS = 5;

export default function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  initialProduct,
}: ProductFormModalProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [costPrice, setCostPrice] = useState<number | string>(0);
  const [sellingPrice, setSellingPrice] = useState<number | string>('');
  const [stockQuantity, setStockQuantity] = useState<number | string>(10);
  const [minStockAlert, setMinStockAlert] = useState<number | string>(5);
  const [warranty, setWarranty] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  
  // Multi-Image State (Up to 5 images)
  const [images, setImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState<string>('');
  const [imageUploadMode, setImageUploadMode] = useState<'upload' | 'url'>('upload');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!initialProduct;

  // Load suppliers list
  useEffect(() => {
    if (isOpen) {
      const fetchSuppliers = async () => {
        try {
          const res = await fetch('/api/suppliers');
          const data = await res.json();
          if (data.success && data.suppliers) {
            setSuppliersList(data.suppliers);
          }
        } catch (err) {
          console.error('Failed to load suppliers:', err);
        }
      };
      fetchSuppliers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialProduct) {
        setName(initialProduct.name);
        setSku(initialProduct.sku);
        if (CATEGORY_OPTIONS.includes(initialProduct.category)) {
          setCategory(initialProduct.category);
          setCustomCategory('');
        } else {
          setCategory('Custom');
          setCustomCategory(initialProduct.category);
        }
        setCostPrice(initialProduct.costPrice);
        setSellingPrice(initialProduct.sellingPrice);
        setStockQuantity(initialProduct.stockQuantity);
        setMinStockAlert(initialProduct.minStockAlert);
        setWarranty(initialProduct.warranty || '');
        setSupplierId(initialProduct.supplierId || initialProduct.supplier?.id || '');
        
        // Initialize images array from images or single image fallback
        let initialImages: string[] = [];
        if (Array.isArray(initialProduct.images) && initialProduct.images.length > 0) {
          initialImages = [...initialProduct.images];
        } else if (initialProduct.image || initialProduct.imageUrl) {
          const single = (initialProduct.image || initialProduct.imageUrl)?.trim();
          if (single) initialImages = [single];
        }
        setImages(initialImages.slice(0, MAX_PHOTOS));
        setUrlInput('');
        setImageUploadMode('upload');
        setDescription(initialProduct.description || '');
        setIsPublic(initialProduct.isPublic !== undefined ? initialProduct.isPublic : true);
      } else {
        setName('');
        setSku(generateSKU('GIFT'));
        setCategory(CATEGORY_OPTIONS[0]);
        setCustomCategory('');
        setCostPrice('');
        setSellingPrice('');
        setStockQuantity(10);
        setMinStockAlert(5);
        setWarranty('');
        setSupplierId('');
        setImages([]);
        setUrlInput('');
        setImageUploadMode('upload');
        setDescription('');
        setIsPublic(true);
      }
      setErrorMsg('');
      setUploadError('');
      setIsSaving(false);
      setIsUploadingImage(false);
      setUploadProgressText('');
    }
  }, [isOpen, initialProduct]);

  if (!isOpen) return null;

  // Margin calculation
  const numCost = Number(costPrice) || 0;
  const numSelling = Number(sellingPrice) || 0;
  const profitMargin = numSelling > 0 ? (((numSelling - numCost) / numSelling) * 100).toFixed(1) : '0';

  const handleGenerateSku = () => {
    setSku(generateSKU('GIFT'));
  };

  // Upload a batch of files to backend (up to remaining slots)
  const handleFilesUpload = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (!fileList.length) return;

    setUploadError('');

    const availableSlots = MAX_PHOTOS - images.length;
    if (availableSlots <= 0) {
      setUploadError(`Maximum of ${MAX_PHOTOS} photos allowed per product. Please remove an existing photo first.`);
      return;
    }

    const filesToUpload = fileList.slice(0, availableSlots);
    if (fileList.length > availableSlots) {
      setUploadError(`Only ${availableSlots} more photo(s) can be added (maximum ${MAX_PHOTOS} photos total).`);
    }

    // Validate mime types and sizes
    for (const f of filesToUpload) {
      if (!f.type.startsWith('image/')) {
        setUploadError(`"${f.name}" is not a valid image file. Please choose JPEG, PNG, WebP, GIF, or SVG.`);
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        setUploadError(`"${f.name}" exceeds the 10MB limit.`);
        return;
      }
    }

    setIsUploadingImage(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setUploadProgressText(`Uploading ${i + 1} of ${filesToUpload.length}...`);

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.url) {
          uploadedUrls.push(data.url);
        } else {
          throw new Error(data.error || `Failed to upload "${file.name}"`);
        }
      }

      setImages((prev) => [...prev, ...uploadedUrls].slice(0, MAX_PHOTOS));
      setUploadError('');
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Error uploading photos. Please try again.');
    } finally {
      setIsUploadingImage(false);
      setUploadProgressText('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesUpload(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  // Add photo via direct URL
  const handleAddUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) return;

    if (images.length >= MAX_PHOTOS) {
      setUploadError(`Maximum of ${MAX_PHOTOS} photos reached.`);
      return;
    }

    setImages((prev) => [...prev, cleanUrl].slice(0, MAX_PHOTOS));
    setUrlInput('');
    setUploadError('');
  };

  // Remove individual photo
  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setUploadError('');
  };

  // Make cover (move to index 0)
  const handleMakeCover = (index: number) => {
    if (index <= 0 || index >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    });
  };

  // Move left / right
  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Product name is required');
      return;
    }
    if (!sku.trim()) {
      setErrorMsg('Barcode / SKU is required');
      return;
    }
    if (!sellingPrice || Number(sellingPrice) <= 0) {
      setErrorMsg('Selling price must be greater than $0.00');
      return;
    }

    const finalCategory = category === 'Custom' ? customCategory.trim() : category;
    if (!finalCategory) {
      setErrorMsg('Please select or specify a category');
      return;
    }

    if (isUploadingImage) {
      setErrorMsg('Please wait for photo uploads to finish before saving.');
      return;
    }

    setIsSaving(true);
    const primaryImg = images.length > 0 ? images[0] : undefined;

    const payload: Partial<Product> = {
      name: name.trim(),
      sku: sku.trim(),
      category: finalCategory,
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      stockQuantity: parseInt(String(stockQuantity), 10) || 0,
      minStockAlert: parseInt(String(minStockAlert), 10) || 5,
      warranty: warranty.trim() || null,
      image: primaryImg,
      imageUrl: primaryImg,
      images: images,
      description: description.trim() || undefined,
      isPublic,
      supplierId: supplierId ? supplierId.trim() : null,
    };

    const success = await onSave(payload);
    setIsSaving(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base font-display">
                {isEdit ? 'Edit Gift Item' : 'Add New Gift Product'}
              </h3>
              <p className="text-xs text-stone-500">
                {isEdit ? 'Update product pricing, images (up to 5), warranty, supplier, and stock levels' : 'Enter product details and photos to add to POS register'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[78vh]">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Scented Soy Candle, Plush Teddy Bear, Wooden Music Box"
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-stone-200 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 font-medium"
            />
          </div>

          {/* SKU & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SKU / Barcode */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-700">
                  Barcode / SKU <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  className="text-[11px] text-pink-600 hover:text-pink-700 font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate SKU</span>
                </button>
              </div>
              <div className="relative">
                <Barcode className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="GIFT-1001"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-xl border border-stone-200 text-sm font-mono focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Layers className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-white rounded-xl border border-stone-200 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 appearance-none font-medium"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="Custom">+ Other Custom Category</option>
                </select>
              </div>
              {category === 'Custom' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category name"
                  className="mt-2 w-full px-3.5 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:border-rose-500"
                />
              )}
            </div>
          </div>

          {/* Optional Supplier Dropdown */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-stone-700">
                Supplier / Vendor <span className="text-stone-400 font-normal">(Optional)</span>
              </label>
              {supplierId && (
                <button
                  type="button"
                  onClick={() => setSupplierId('')}
                  className="text-[11px] text-stone-400 hover:text-rose-600"
                >
                  Clear Supplier
                </button>
              )}
            </div>
            <div className="relative">
              <Building2 className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-white rounded-xl border border-stone-200 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 appearance-none font-medium"
              >
                <option value="">-- None / Unassigned Supplier --</option>
                {suppliersList.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.company} ({sup.name})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Link this product to a registered supplier to track wholesale vendors
            </p>
          </div>

          {/* Pricing & Margins */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800">Pricing & Margins</span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                Profit Margin: {profitMargin}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Cost Price ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-stone-400 font-mono text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 bg-white rounded-xl border border-stone-200 text-sm font-mono focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Selling Price ($) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-stone-400 font-mono text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="19.99"
                    className="w-full pl-7 pr-3 py-2 bg-white rounded-xl border border-stone-300 text-sm font-mono font-bold focus:border-rose-500 text-stone-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stock Levels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Stock Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-stone-200 text-sm font-mono font-medium focus:border-rose-500"
              />
              <p className="text-[11px] text-stone-400 mt-0.5">Current units in boutique</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Low Stock Alert Limit
              </label>
              <input
                type="number"
                min="1"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-stone-200 text-sm font-mono font-medium focus:border-rose-500"
              />
              <p className="text-[11px] text-stone-400 mt-0.5">Trigger warning when stock drops to</p>
            </div>
          </div>

          {/* Warranty Period Field */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Warranty Period</span>
                <span className="text-stone-400 font-normal">(Optional)</span>
              </label>
              {warranty && (
                <button
                  type="button"
                  onClick={() => setWarranty('')}
                  className="text-[11px] text-stone-400 hover:text-rose-600"
                >
                  Clear Warranty
                </button>
              )}
            </div>

            {/* Quick Preset Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {WARRANTY_PRESETS.map((preset) => {
                const isSelected = preset === 'No Warranty' ? !warranty : warranty === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      if (preset === 'No Warranty') {
                        setWarranty('');
                      } else {
                        setWarranty(preset);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-stone-600 hover:bg-stone-200/80 border border-stone-200/80'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>

            {/* Custom Input */}
            <div className="relative pt-1">
              <ShieldCheck className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                placeholder="e.g. 6 Months, 1 Year, 2 Years Replacement..."
                className="w-full pl-9 pr-3.5 py-2 bg-white rounded-xl border border-stone-200 text-xs font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <p className="text-[11px] text-stone-400">
              When provided, receipts, PDF invoices, quotations, and catalog orders will display: <strong className="text-stone-600 font-semibold">{name ? `${name} (${warranty || '6 Months'} Warranty)` : `Item Name (${warranty || '6 Months'} Warranty)`}</strong>
            </p>
          </div>

          {/* MULTI-PRODUCT IMAGE SECTION (UP TO 5 PHOTOS) */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-800">
                  Product Photos (Up to 5)
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  images.length === MAX_PHOTOS
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-stone-200 text-stone-700'
                }`}>
                  {images.length} / {MAX_PHOTOS} photos
                </span>
              </div>

              {/* Upload Mode Switcher */}
              <div className="flex items-center gap-1 bg-stone-200/70 p-0.5 rounded-xl text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setImageUploadMode('upload')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    imageUploadMode === 'upload'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Files</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageUploadMode('url')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    imageUploadMode === 'url'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Add URL</span>
                </button>
              </div>
            </div>

            {uploadError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Existing Photos Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                {images.map((imgUrl, idx) => (
                  <div
                    key={`${imgUrl}-${idx}`}
                    className={`group relative aspect-square rounded-2xl overflow-hidden border-2 bg-stone-100 flex flex-col justify-between shadow-2xs transition-all ${
                      idx === 0
                        ? 'border-rose-500 ring-2 ring-rose-500/20'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {/* Image Preview */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt={`Product photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Cover Photo Badge (Top Left) */}
                    <div className="absolute top-1.5 left-1.5 z-10">
                      {idx === 0 ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-bold shadow-xs">
                          <Star className="w-2.5 h-2.5 fill-white" />
                          <span>Cover</span>
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-stone-900/60 backdrop-blur-xs text-white text-[9px] font-mono font-semibold">
                          #{idx + 1}
                        </span>
                      )}
                    </div>

                    {/* Delete Photo Button (Top Right) */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-stone-900/70 hover:bg-rose-600 text-white backdrop-blur-xs transition-colors shadow-xs cursor-pointer z-10"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    {/* Reorder / Set Cover Overlay Bar (Bottom) */}
                    <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between opacity-90 group-hover:opacity-100 transition-opacity z-10">
                      {/* Move Left */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveImage(idx, 'left')}
                        className="p-1 text-white hover:text-pink-300 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                        title="Move photo left"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>

                      {/* Make Cover Button if not already cover */}
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleMakeCover(idx)}
                          className="px-1.5 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white text-[8px] font-bold uppercase tracking-wider backdrop-blur-xs cursor-pointer"
                          title="Set as main cover photo"
                        >
                          Make Cover
                        </button>
                      )}

                      {/* Move Right */}
                      <button
                        type="button"
                        disabled={idx === images.length - 1}
                        onClick={() => handleMoveImage(idx, 'right')}
                        className="p-1 text-white hover:text-pink-300 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                        title="Move photo right"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add More Mini Tile (if under 5) */}
                {images.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => {
                      if (imageUploadMode === 'upload') {
                        fileInputRef.current?.click();
                      }
                    }}
                    className="aspect-square rounded-2xl border-2 border-dashed border-stone-300 hover:border-rose-400 hover:bg-rose-50/40 text-stone-500 hover:text-rose-600 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer p-2 text-center group"
                  >
                    <div className="w-7 h-7 rounded-xl bg-white shadow-2xs flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus className="w-4 h-4 text-rose-500" />
                    </div>
                    <span className="text-[10px] font-bold">Add Photo</span>
                    <span className="text-[9px] text-stone-400">{MAX_PHOTOS - images.length} left</span>
                  </button>
                )}
              </div>
            )}

            {/* Upload Area / Controls */}
            {images.length < MAX_PHOTOS && (
              <div className="pt-1">
                {imageUploadMode === 'upload' ? (
                  /* File Upload Drop Zone */
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                      isDragging
                        ? 'border-rose-500 bg-rose-50/60'
                        : 'border-stone-300 hover:border-stone-400 bg-white hover:bg-stone-50/80'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div className="w-10 h-10 rounded-2xl bg-pink-50 text-rose-600 shadow-2xs flex items-center justify-center mb-1.5">
                      {isUploadingImage ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <UploadCloud className="w-5 h-5" />
                      )}
                    </div>

                    <div className="text-center">
                      <span className="text-xs font-bold text-stone-800">
                        {isUploadingImage ? uploadProgressText || 'Uploading photos...' : 'Click or drag & drop up to 5 photos'}
                      </span>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        PNG, JPG, WebP, GIF, or SVG up to 10MB each. Select multiple files at once.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* URL Input Form */
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <ImageIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddUrl(e)}
                        placeholder="Paste image URL (https://...)"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-xl border border-stone-200 text-xs focus:border-rose-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddUrl()}
                      disabled={!urlInput.trim() || images.length >= MAX_PHOTOS}
                      className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Add Photo
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Note about multi-image catalog */}
            <p className="text-[11px] text-stone-400">
              💡 The 1st photo is the primary cover image displayed in POS registers. Customers on the web catalog can browse all {MAX_PHOTOS} photos via carousel sliders.
            </p>
          </div>

          {/* Description / Gift Notes */}
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">
              Product Description / Gift Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Features, material details, packaging..."
              className="w-full px-3.5 py-2 bg-white rounded-xl border border-stone-200 text-xs focus:border-rose-500"
            />
          </div>

          {/* Public Web Catalog Visibility Toggle */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                isPublic ? 'bg-pink-100 text-pink-700' : 'bg-stone-200 text-stone-500'
              }`}>
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-900">Show on Public Web Catalog</span>
                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                    isPublic ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {isPublic ? 'Visible to Customers' : 'Internal POS Only'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  When enabled, this gift item will appear on the customer-facing online catalog (<code className="text-pink-600 font-mono">/catalog</code>).
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                isPublic ? 'bg-rose-600' : 'bg-stone-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isPublic ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isUploadingImage}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || isUploadingImage}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-600/25 transition-all font-display"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Product...</span>
                </>
              ) : (
                <span>{isEdit ? 'Update Product' : 'Save & Add to Catalog'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
