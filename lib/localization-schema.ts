
import { z } from "zod";

export const marketingMessageSchema = z.object({
  channel: z.enum([
    "SOCIAL_MEDIA",
    "EMAIL",
    "ADVERTISEMENT",
  ]),
  headline: z.string().min(5).max(120),
  message: z.string().min(20).max(500),
});

export const localizationFaqSchema = z.object({
  question: z.string().min(5).max(200),
  answer: z.string().min(10).max(500),
});

export const productLocalizationSchema = z.object({
  localizedTitle: z.string().min(5).max(150),

  localizedDescription: z.string().min(30).max(2000),

  culturalGuidance: z
    .array(z.string().min(10).max(300))
    .min(2)
    .max(5),

  seoKeywords: z
    .array(z.string().min(2).max(60))
    .min(3)
    .max(10),

  marketingMessages: z
    .array(marketingMessageSchema)
    .min(2)
    .max(4),

  faqs: z
    .array(localizationFaqSchema)
    .min(3)
    .max(5),
});

export type ProductLocalizationContent = z.infer<
  typeof productLocalizationSchema
>;

export type MarketingMessage = z.infer<
  typeof marketingMessageSchema
>;

export type LocalizationFaq = z.infer<
  typeof localizationFaqSchema
>;
