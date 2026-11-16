
import { z } from "zod";

const percentageSchema = z
  .number()
  .finite()
  .min(0)
  .max(99.99);

export const pricingInputsSchema = z
  .object({
    manufacturingCost: z.number().finite().nonnegative(),
    packagingCost: z.number().finite().nonnegative(),
    shippingCost: z.number().finite().nonnegative(),

    exchangeRate: z.number().finite().positive(),

    customsDutyRate: percentageSchema,
    platformFeeRate: percentageSchema,
    paymentFeeRate: percentageSchema,
    taxRate: percentageSchema,
    desiredProfitMargin: percentageSchema,
  })
  .refine(
    (inputs) =>
      inputs.platformFeeRate +
        inputs.paymentFeeRate +
        inputs.taxRate +
        inputs.desiredProfitMargin <
      100,
    {
      message:
        "Platform fees, payment fees, tax and profit margin must total less than 100%.",
      path: ["desiredProfitMargin"],
    },
  );

export const createPricingScenarioSchema = z.object({
  productId: z.string().min(1),
  marketResultId: z.string().min(1),

  title: z.string().trim().max(100).optional(),

  targetCurrency: z
    .string()
    .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter uppercase code."),

  exchangeRateSource: z.string().trim().max(200).optional(),

  exchangeRateDate: z
    .string()
    .datetime({ offset: true })
    .optional(),

  inputs: pricingInputsSchema,
});

export type CreatePricingScenarioInput = z.infer<
  typeof createPricingScenarioSchema
>;
