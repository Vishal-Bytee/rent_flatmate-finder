import { api } from "./client";
import { Listing, InterestRequest, Message, AdminStats, TenantProfile, User, Rating, RatingSummary } from "../types";

export const authApi = {
  register: (data: { name: string; email: string; password: string; role: "TENANT" | "OWNER"; phone?: string }) =>
    api.post<{ user: User; token: string }>("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post<{ user: User; token: string }>("/auth/login", data),
  me: () => api.get<User>("/auth/me"),
};

export const listingApi = {
  search: (params: { location?: string; minRent?: number; maxRent?: number; page?: number }) =>
    api.get<{ listings: Listing[]; total: number }>("/listings", params as Record<string, string | number | undefined>),
  getOne: (id: string) => api.get<Listing>(`/listings/${id}`),
  mine: () => api.get<Listing[]>("/listings/mine"),
  create: (data: Partial<Listing>) => api.post<Listing>("/listings", data),
  update: (id: string, data: Partial<Listing>) => api.put<Listing>(`/listings/${id}`, data),
  remove: (id: string) => api.delete<null>(`/listings/${id}`),
  markFilled: (id: string, isFilled: boolean) => api.patch<Listing>(`/listings/${id}/fill`, { isFilled }),
  uploadImages: (id: string, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append("images", f));
    return api.post<Listing>(`/listings/${id}/images`, form);
  },
  getTenantProfile: () => api.get<TenantProfile | null>("/listings/tenant/profile"),
  upsertTenantProfile: (data: Partial<TenantProfile>) => api.post<TenantProfile>("/listings/tenant/profile", data),
};

export const interestApi = {
  create: (listingId: string) => api.post<InterestRequest>("/interests", { listingId }),
  mine: () => api.get<InterestRequest[]>("/interests"),
  accept: (id: string) => api.patch<{ request: InterestRequest; chatRoom: { id: string } }>(`/interests/${id}/accept`),
  decline: (id: string) => api.patch<InterestRequest>(`/interests/${id}/decline`),
};

export const chatApi = {
  getMessages: (roomId: string) => api.get<Message[]>(`/chat/${roomId}/messages`),
};

export const ratingApi = {
  list: (listingId: string) => api.get<{ ratings: Rating[]; summary: RatingSummary }>(`/listings/${listingId}/ratings`),
  rate: (listingId: string, stars: number, comment?: string) =>
    api.post<Rating>(`/listings/${listingId}/ratings`, { stars, comment: comment || undefined }),
  mine: (listingId: string) => api.get<Rating | null>(`/listings/${listingId}/ratings/mine`),
};

export const adminApi = {
  dashboard: () => api.get<AdminStats>("/admin/dashboard"),
  listUsers: () => api.get<User[]>("/admin/users"),
  deactivateUser: (id: string) => api.delete<null>(`/admin/users/${id}`),
  listListings: () => api.get<Listing[]>("/admin/listings"),
  deleteListing: (id: string) => api.delete<null>(`/admin/listings/${id}`),
};
