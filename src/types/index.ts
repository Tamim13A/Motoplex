export interface ProductVariant {
  id: string;
  name: string;
  size?: string;
  color?: string;
  colorHex?: string;
  material?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku: string;
}

export interface ProductReview {
  id: string;
  userName: string;
  userCity: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  avatar?: string;
  image?: string;
  status?: "pending" | "approved" | "rejected";
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  brand: string;
  productType?: string;
  category: string;
  categorySlug: string;
  subcategory: string;
  subcategorySlug: string;
  childCategory?: string;
  productGroup?: string;
  price: number;
  compareAtPrice?: number;
  discountPercentage?: number;
  rating: number;
  reviewCount: number;
  sku: string;
  stock: number;
  costPrice?: number;
  images: string[];
  description: string;
  features: string[];
  specifications: Record<string, string>;
  variants: ProductVariant[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  materials: string[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isPreOrder?: boolean;
}

export interface CategoryGroup {
  id: string;
  name: string;
  slug: string;
}

export interface ChildCategory {
  id: string;
  name: string;
  slug: string;
  productGroups: CategoryGroup[];
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  itemCount?: number;
  childCategories: ChildCategory[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  itemCount: number;
  subcategories: SubCategory[];
  featured?: boolean;
}

export interface CartItem {
  product: Product;
  selectedVariant?: ProductVariant;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedMaterial?: string;
}

export interface Coupon {
  code: string;
  type: "percentage" | "flat" | "free_shipping";
  value: number;
  minOrder: number;
  description: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  variantInfo: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  advancePaid?: number;
  dueAmount?: number;
  paymentDetails?: {
    advancePaymentMethod?: string;
    advanceAmount?: number;
    senderNumber?: string;
    trxId?: string;
    bankName?: string;
    accountNumber?: string;
    reference?: string;
  };
  shippingAddress: {
    fullName: string;
    phone: string;
    division: string;
    district: string;
    area: string;
    address: string;
  };
  deliveryMethod: string;
  paymentMethod: string;
  paymentStatus?: "Pending" | "Paid" | "Failed";
  trackingNumber?: string;
  courierName?: "Pathao" | "Steadfast" | "RedX" | string;
  stockDeducted?: boolean;
}

export interface ServiceBookingItem {
  id: string;
  bookingNumber: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  bikeBrand: string;
  bikeModel: string;
  bikePlate?: string;
  dealershipId: string;
  dealershipName: string;
  dealershipCity: string;
  bookingDate: string;
  bookingSlot: string;
  specialNotes?: string;
  image?: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  createdAt?: string;
}

export interface FilterState {
  category?: string;
  subcategory?: string;
  priceRange: [number, number];
  sizes: string[];
  colors: string[];
  materials: string[];
  inStockOnly: boolean;
  rating?: number;
  searchQuery: string;
  sortBy: "featured" | "price-asc" | "price-desc" | "rating" | "newest";
}
