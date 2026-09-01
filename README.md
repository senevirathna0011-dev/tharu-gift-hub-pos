# Tharu Gift Hub — Gift Shop POS & Stock Management System

A modern, responsive, web-based Point of Sale (POS) and Stock Management System tailored for gift shops, souvenir boutiques, and specialty stores.

Built with **Next.js 14 (App Router)**, **Tailwind CSS**, **Prisma ORM**, **SQLite / PostgreSQL**, and an **80mm CSS thermal receipt print engine**.

---

## ✨ Features

- 🛒 **POS Billing Terminal (`/pos`)**:
  - Barcode scanner integration (automatic enter detection) & real-time title search.
  - Category filter pills (Toys & Plush, Greeting Cards, Personalized, Candles, Mugs, Decor, Gift Wrap).
  - Product grid with visual stock badges (In Stock, Low Stock, Out of Stock).
  - Dynamic cart with quantity modifiers (`+` / `-`), discount presets (5%, 10%, 15%, Custom), and tax toggles.
  - Payment Modal with Cash Calculator (Preset notes: Exact, $10, $20, $50, $100, +$5, +$10) and live change due calculation.
  - Confetti celebration on completed transaction.

- 🧾 **80mm Thermal Receipt Printing**:
  - Pixel-perfect monospace thermal receipt layout (`ThermalReceipt.tsx`).
  - CSS `@media print` engine that strips away non-essential UI (navbars, buttons, modals) during printing.
  - Includes store metadata, itemized table, totals breakdown, change due, return policy, and barcode.
  - 1-click preview and reprint functionality.

- 📦 **Stock & Product Management (`/inventory`)**:
  - KPI metric cards (Total SKUs, Inventory Asset Valuation, Low Stock Alerts, Out of Stock).
  - Interactive inventory table with search, category filtering, and low stock highlighting.
  - **Inline fast stock modifiers** (`+1`, `-1`, `+5`, direct number input with auto-save).
  - Add / Edit product modal with auto SKU generator (`GIFT-XXXXXX`) and live profit margin % computation.

- 🧾 **Sales & Receipts History (`/sales`)**:
  - Searchable transaction ledger by receipt number or customer name.
  - Filter by payment method (Cash, Card, Digital).
  - 1-click thermal receipt reprint modal.

- 📊 **Business Analytics (`/analytics`)**:
  - Today's revenue, transactions count, and units sold.
  - Top 5 best-selling gift items with volume bars.
  - Total inventory valuation and low-stock replenishment alerts.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js 18+** or **Node.js 20+**

### 2. Installation & Database Setup
```bash
# Clone or open the project folder
cd POS

# Install dependencies
npm install

# Push database schema & seed realistic gift items
npm run db:setup
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Schema (`prisma/schema.prisma`)

```prisma
model Product {
  id            String      @id @default(cuid())
  name          String
  sku           String      @unique
  category      String
  costPrice     Float       @default(0.0)
  sellingPrice  Float
  stockQuantity Int         @default(0)
  minStockAlert Int         @default(5)
  image         String?
  description   String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  saleItems     SaleItem[]
}

model Sale {
  id             String      @id @default(cuid())
  receiptNo      String      @unique
  customerName   String?     @default("Walk-in Customer")
  subtotal       Float
  discountType   String      @default("NONE")
  discountValue  Float       @default(0.0)
  discountAmount Float       @default(0.0)
  taxRate        Float       @default(0.0)
  taxAmount      Float       @default(0.0)
  totalAmount    Float
  paymentMethod  String      @default("CASH")
  amountPaid     Float
  changeDue      Float       @default(0.0)
  notes          String?
  createdAt      DateTime    @default(now())
  items          SaleItem[]
}

model SaleItem {
  id          String   @id @default(cuid())
  saleId      String
  sale        Sale     @relation(fields: [saleId], references: [id], onDelete: Cascade)
  productId   String?
  product     Product? @relation(fields: [productId], references: [id], onDelete: SetNull)
  productName String
  productSku  String
  quantity    Int
  unitPrice   Float
  subtotal    Float
}
```

---

## 🖨️ Thermal Receipt Printing Configuration

The receipt uses CSS `@media print` rules defined in `src/app/globals.css`:
- `@page { size: 80mm auto; margin: 0; }`
- Automatically scales and aligns for standard 80mm and 58mm POS thermal receipt rolls.
- Hides all web navigation and action buttons when printing (`window.print()`).
