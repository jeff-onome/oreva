
// FIX: Added and updated several types to resolve compilation errors across the application.
// This includes adding types for Reviews, Wishlist, Payment Methods, Support Tickets,
// and expanding the User and SiteSettings types.

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  profilePictureUrl?: string;
  isAdmin: boolean;
  notifications_orders?: boolean;
  notifications_promos?: boolean;
  notifications_newsletter?: boolean;
  loyaltyPoints?: number;
}

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  is_default: boolean;
  createdAt?: any;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  card_type: 'Visa' | 'Mastercard';
  last4: string;
  expiry_month: number;
  expiry_year: number;
  is_default: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sale_price?: number | null;
  categories: Category[];
  images: string[];
  stock: number;
  rating: number;
  reviews: number;
  created_at?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  products: Product | null;
}

export enum OrderStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Shipped = 'Shipped',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled'
}

export interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string | null;
}

export interface Order {
  id: string;
  userId: string;
  createdAt: any; // Can be Firebase Timestamp or number
  total: number;
  subtotal: number;
  status: OrderStatus;
  paymentMethod?: 'card' | 'cod';
  items: OrderItem[];
  itemIds?: string[];
  shippingAddress: {
      firstName: string;
      lastName: string;
      address: string;
      city: string;
      state: string;
      zip: string;
  };
  coupon?: { code: string; value: number; type: 'percentage' | 'fixed' } | null;
  tracking_number?: string;
  users?: { // This is denormalized data added when reading
    first_name: string;
    last_name: string;
    email: string;
  }
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
  expires_at?: string;
  createdAt?: any;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  createdAt: any;
  profiles: {
    first_name: string;
    last_name: string;
  };
  products?: {
    id: string;
    name: string;
  }
}

export enum SupportTicketStatus {
  Open = 'Open',
  InProgress = 'In Progress',
  Closed = 'Closed'
}

export interface SupportTicket {
  id: string;
  userId: string;
  createdAt: any;
  resolvedAt?: string;
  subject: string;
  details: string;
  status: SupportTicketStatus;
  users?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

// --- Site Settings Related Types ---

export interface FlashSale {
    active: boolean;
    title: string;
    productId: string;
    endDate: string;
}

export interface AboutPageContent {
    title: string;
    subtitle: string;
    missionTitle: string;
    missionContent: string;
}

export interface HeroSlide {
    imageUrl: string;
    title: string;
    subtitle: string;
}

export interface ThemeColors {
    primary: string;
    'primary-hover': string;
    secondary: string;
    'secondary-hover': string;
    accent: string;
    neutral: string;
    base: string;
    'text-primary': string;
    'text-secondary': string;
}

export interface SiteName {
    name: string;
}

export interface SocialLinks {
    github: string;
    twitter: string;
    linkedin: string;
}

export interface ContactInfo {
    address: string;
    phone: string;
    email: string;
    hours: string;
}

export interface SiteSettings {
    flash_sale: FlashSale;
    about_page: AboutPageContent;
    hero_slides: HeroSlide[];
    theme_colors: ThemeColors;
    site_name: SiteName;
    social_links: SocialLinks;
    contact_info: ContactInfo;
}
