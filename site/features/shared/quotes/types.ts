import type { SharedProduct } from '../catalog/types'

export interface SharedQuoteItem {
  product: SharedProduct
  quantity: number
}

export interface SharedQuote {
  id: string
  items: SharedQuoteItem[]
  totalAmount: number
}

export interface QuoteLineItem {
  productName: string;
  sku: string;
  category: string;
  quantity: number;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  unitPriceInr: number | null; // null = "pricing pending"
  lineTotal: number | null;
}

export interface QuoteResult {
  mode: 'request' | 'auto';
  lineItems: QuoteLineItem[];
  pricedTotal: number;
  hasPendingItems: boolean;
  pendingCount: number;
  generatedAt: string;
}
