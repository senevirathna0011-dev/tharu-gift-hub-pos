export type UserRole = 'ADMIN' | 'CASHIER';

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  pin?: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface StoreSettings {
  id?: string;
  shopName: string;
  shopTagline?: string | null;
  address: string;
  phone: string;
  email?: string | null;
  currencySymbol: string;
  currencyCode: string;
  taxRate: number;
  receiptFooter: string;
  receiptNote?: string | null;
  updatedAt?: string | Date;
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  products?: Product[];
  _count?: {
    products?: number;
  };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockAlert: number;
  image?: string | null;
  imageUrl?: string | null;
  images?: string[];
  description?: string | null;
  isPublic?: boolean;
  supplierId?: string | null;
  supplier?: Supplier | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CatalogProduct {
  id: string;
  name: string;
  sku?: string;
  category: string;
  sellingPrice: number;
  image?: string | null;
  images?: string[];
  description?: string | null;
  inStock: boolean;
}

export interface CatalogCartItem {
  product: CatalogProduct;
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  loyaltyPoints: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  salesCount?: number;
  totalSpent?: number;
  sales?: Sale[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  customPrice?: number;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'DIGITAL';
export type DiscountType = 'NONE' | 'PERCENTAGE' | 'FIXED';

export interface SaleItem {
  id: string;
  saleId: string;
  productId?: string | null;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SalesReturnItem {
  id: string;
  returnId: string;
  productId?: string | null;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  reason?: string | null;
}

export interface SalesReturn {
  id: string;
  returnNo: string;
  saleId: string;
  sale?: Sale | null;
  receiptNo: string;
  customerId?: string | null;
  customerName?: string | null;
  cashierId?: string | null;
  cashierName?: string | null;
  refundAmount: number;
  refundMethod: string;
  reason: string;
  notes?: string | null;
  createdAt: string | Date;
  items: SalesReturnItem[];
}

export interface Sale {
  id: string;
  receiptNo: string;
  customerId?: string | null;
  customer?: Customer | null;
  customerName?: string | null;
  customerPhone?: string | null;
  cashierId?: string | null;
  cashierName?: string | null;
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeDue: number;
  notes?: string | null;
  createdAt: string | Date;
  items: SaleItem[];
  returns?: SalesReturn[];
}

export interface CheckoutPayload {
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  cashierId?: string;
  cashierName?: string;
  discountType: DiscountType;
  discountValue: number;
  taxRate: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  notes?: string;
}

export interface QuotationItem {
  id?: string;
  productId?: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Quotation {
  id: string;
  quotationNo: string;
  customerId?: string | null;
  customer?: Customer | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string | null;
  validUntil: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  items: QuotationItem[];
}

export interface QuotationPayload {
  items: {
    productId?: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
  }[];
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  discountType: DiscountType;
  discountValue: number;
  taxRate: number;
  notes?: string;
}

export interface CashierShiftStats {
  cashierId: string;
  cashierName: string;
  date: string;
  totalSalesAmount: number;
  totalTransactionsCount: number;
  totalItemsSold: number;
  paymentBreakdown: {
    cash: { amount: number; count: number };
    card: { amount: number; count: number };
    digital: { amount: number; count: number };
    credit: { amount: number; count: number };
  };
  sales: Sale[];
}

export type ReportDateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export interface SalesReportStats {
  period: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMarginPercent: number;
  totalTransactionsCount: number;
  totalUnitsSold: number;
  averageOrderValue: number;
  paymentMethods: {
    cashRevenue: number;
    cashCount: number;
    cardRevenue: number;
    cardCount: number;
    digitalRevenue: number;
    digitalCount: number;
  };
  topProducts: {
    productName: string;
    productSku: string;
    totalQuantity: number;
    totalRevenue: number;
    totalProfit: number;
  }[];
  categorySales: {
    category: string;
    totalQuantity: number;
    totalRevenue: number;
  }[];
  sales: (Sale & {
    costAmount?: number;
    profitAmount?: number;
  })[];
  todaySummary: {
    revenue: number;
    cost: number;
    profit: number;
    salesCount: number;
    itemsSold: number;
  };
}

export interface DashboardStats {
  todayRevenue: number;
  todaySalesCount: number;
  todayItemsSold: number;
  totalInventoryValue: number;
  totalProductsCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalCatalogViews?: number;
  lastCatalogView?: string | Date;
  recentSales: Sale[];
  topSellingProducts: {
    productName: string;
    productSku: string;
    totalQuantity: number;
    totalRevenue: number;
  }[];
}

export interface CatalogAnalytics {
  id: string;
  totalViews: number;
  lastViewedAt: string | Date;
  updatedAt: string | Date;
}
