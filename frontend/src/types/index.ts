export type Role = "TENANT" | "OWNER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface TenantProfile {
  id: string;
  preferredLocation: string;
  minimumBudget: number;
  maximumBudget: number;
  moveInDate: string;
  gender?: string;
  occupation?: string;
}

export type RoomType = "SINGLE" | "SHARED" | "STUDIO" | "ONE_BHK" | "TWO_BHK" | "THREE_BHK_PLUS";
export type FurnishingStatus = "UNFURNISHED" | "SEMI_FURNISHED" | "FULLY_FURNISHED";
export type InterestStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface ListingImage {
  id: string;
  url: string;
}

export interface Compatibility {
  score: number;
  explanation: string;
}

export interface RatingSummary {
  average: number;
  count: number;
}

export interface Rating {
  id: string;
  stars: number;
  comment?: string | null;
  createdAt: string;
  tenant: { user: { name: string } };
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  location: string;
  rent: number;
  availableFrom: string;
  roomType: RoomType;
  furnishingStatus: FurnishingStatus;
  isFilled: boolean;
  createdAt: string;
  images: ListingImage[];
  compatibility?: Compatibility | null;
  rating?: RatingSummary;
}

export interface InterestRequest {
  id: string;
  status: InterestStatus;
  createdAt: string;
  listing?: Listing;
  tenant?: { user: { name: string; email: string } };
  chatRoom?: { id: string } | null;
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; name: string; role: Role };
}

export interface AdminStats {
  totalUsers: number;
  totalOwners: number;
  totalTenants: number;
  totalListings: number;
  filledListings: number;
  activeChats: number;
  interestRequests: number;
  totalMessages: number;
}
