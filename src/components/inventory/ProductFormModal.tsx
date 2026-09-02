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
  Globe
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
  const [supplierId, setSupplierId] = useState<string>('');
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  
  // Image handling
  const [image, setImage] = useState('');
  const [imageUploadMode, setImageUploadMode] = useState<'upload' | 'url'>('upload');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
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
        setSupplierId(initialProduct.supplierId || initialProduct.supplier?.id || '');
        
        const initialImg = initialProduct.image || initialProduct.imageUrl || '';
        setImage(initialImg);
        setImagePreviewUrl(initialImg);
        setImageUploadMode(initialImg.startsWith('http') ? 'url' : 'upload');
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
        setSupplierId('');
        setImage('');
        setImagePreviewUrl('');
        setImageUploadMode('upload');
        setDescription('');
        setIsPublic(true);
      }
      setErrorMsg('');
      setUploadError('');
      setIsSaving(false);
      setIsUploadingImage(false);
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

  // Upload local file to backend
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPEG, PNG, WebP, GIF, SVG, AVIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image file is too large (max 10MB).');
      return;
    }

    setUploadError('');
    setIsUploadingImage(true);

    // Instant local thumbnail preview
    const localBlobUrl = URL.createObjectURL(file);
    setImagePreviewUrl(localBlobUrl);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setImage(data.url);
        setImagePreviewUrl(data.url);
      } else {
        setUploadError(data.error || 'Failed to upload image to server');
        setImage('');
        setImagePreviewUrl('');
      }
    } catch (err: any) {
      setUploadError('Network error uploading file. Please try again.');
      setImage('');
      setImagePreviewUrl('');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleRemoveImage = () => {
    setImage('');
    setImagePreviewUrl('');
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setImage(val);
    setImagePreviewUrl(val);
    setUploadError('');
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
      setErrorMsg('Please wait for the image upload to complete before saving.');
      return;
    }

    setIsSaving(true);
    const payload: Partial<Product> = {
      name: name.trim(),
      sku: sku.trim(),
      category: finalCategory,
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      stockQuantity: parseInt(String(stockQuantity), 10) || 0,
      minStockAlert: parseInt(String(minStockAlert), 10) || 5,
      image: image.trim() || undefined,
      imageUrl: image.trim() || undefined,
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
                {isEdit ? 'Update product pricing, supplier, image, and inventory levels' : 'Enter product details to add to POS register'}
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

          {/* PRODUCT IMAGE UPLOAD SECTION */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-700">
                Product Image
              </label>
              <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setImageUploadMode('upload')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    imageUploadMode === 'upload'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageUploadMode('url')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    imageUploadMode === 'url'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Image URL</span>
                </button>
              </div>
            </div>

            {uploadError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* If image is selected or already exists -> show preview card */}
            {imagePreviewUrl ? (
              <div className="relative flex items-center gap-4 p-3 bg-stone-50 rounded-2xl border border-stone-200">
                {/* Thumbnail Preview */}
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-200 border border-stone-300 shrink-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreviewUrl}
                    alt="Product Preview"
                    className="w-full h-full object-cover"
                    onError={() => {
                      setUploadError('Unable to load image from given source.');
                    }}
                  />
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">Image Ready</span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-mono truncate mt-0.5">
                    {image || imagePreviewUrl}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={isUploadingImage}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : imageUploadMode === 'upload' ? (
              /* Local File Drag & Drop Box */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                  isDragging
                    ? 'border-rose-500 bg-rose-50/50'
                    : 'border-stone-200 hover:border-stone-400 bg-stone-50/50 hover:bg-stone-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-white text-rose-600 shadow-sm flex items-center justify-center mb-2">
                  {isUploadingImage ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <UploadCloud className="w-6 h-6" />
                  )}
                </div>

                <div className="text-center">
                  <span className="text-xs font-bold text-stone-800">
                    {isUploadingImage ? 'Uploading Image...' : 'Click to browse or drag & drop image'}
                  </span>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    PNG, JPG, WebP, GIF, or SVG up to 10MB. Automatically formatted for instant storage.
                  </p>
                </div>
              </div>
            ) : (
              /* External URL Input */
              <div className="relative">
                <ImageIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="url"
                  value={image}
                  onChange={handleUrlChange}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white rounded-xl border border-stone-200 text-xs focus:border-rose-500"
                />
              </div>
            )}
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
