import { z } from "zod";

export const createListingSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  location: z.string().min(2),
  rent: z.number().int().positive(),
  availableFrom: z.coerce.date(),
  roomType: z.enum(["SINGLE", "SHARED", "STUDIO", "ONE_BHK", "TWO_BHK", "THREE_BHK_PLUS"]),
  furnishingStatus: z.enum(["UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"]),
  images: z.array(z.string().url()).optional(),
});

export const updateListingSchema = createListingSchema.partial();

export const tenantProfileSchema = z.object({
  preferredLocation: z.string().min(2),
  minimumBudget: z.number().int().nonnegative(),
  maximumBudget: z.number().int().positive(),
  moveInDate: z.coerce.date(),
  gender: z.string().optional(),
  occupation: z.string().optional(),
}).refine((data) => data.maximumBudget >= data.minimumBudget, {
  message: "maximumBudget must be greater than or equal to minimumBudget",
  path: ["maximumBudget"],
});

export const ratingSchema = z.object({
  stars: z.number().int().min(1, "Rating must be at least 1 star").max(5, "Rating cannot exceed 5 stars"),
  comment: z.string().max(500, "Comment must be under 500 characters").optional(),
});

export type RatingInput = z.infer<typeof ratingSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type TenantProfileInput = z.infer<typeof tenantProfileSchema>;
