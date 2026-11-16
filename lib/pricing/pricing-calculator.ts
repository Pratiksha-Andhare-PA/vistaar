
export interface PricingInputs {
  manufacturingCost: number;
  packagingCost: number;
  shippingCost: number;
  exchangeRate: number;
  customsDutyRate: number;
  platformFeeRate: number;
  paymentFeeRate: number;
  taxRate: number;
  desiredProfitMargin: number;
}

export interface PricingBreakdown {
  sourceCost: number;
  convertedLandedCost: number;
  customsDuty: number;
  totalCost: number;
  platformFee: number;
  paymentFee: number;
  tax: number;
  profit: number;
  recommendedPrice: number;
  effectiveProfitMargin: number;
}

const round = (value: number, decimals = 2): number =>
  Number(value.toFixed(decimals));

function validateInputs(inputs: PricingInputs): void {
  const values = Object.values(inputs);

  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error("All pricing inputs must be valid numbers.");
  }

  const nonNegative = [
    inputs.manufacturingCost,
    inputs.packagingCost,
    inputs.shippingCost,
  ];

  if (nonNegative.some((value) => value < 0)) {
    throw new Error("Costs cannot be negative.");
  }

  if (inputs.exchangeRate <= 0) {
    throw new Error("Exchange rate must be greater than zero.");
  }

  const rates = [
    inputs.customsDutyRate,
    inputs.platformFeeRate,
    inputs.paymentFeeRate,
    inputs.taxRate,
    inputs.desiredProfitMargin,
  ];

  if (rates.some((rate) => rate < 0 || rate >= 100)) {
    throw new Error("Percentage rates must be between 0 and less than 100.");
  }
}

export function calculateGlobalPrice(
  inputs: PricingInputs,
): PricingBreakdown {
  validateInputs(inputs);

  const sourceCost =
    inputs.manufacturingCost +
    inputs.packagingCost +
    inputs.shippingCost;

  const convertedLandedCost = sourceCost * inputs.exchangeRate;

  // Simplified MVP assumption: customs duty applies to the
  // converted manufacturing, packaging and shipping costs.
  const customsDuty =
    convertedLandedCost * (inputs.customsDutyRate / 100);

  const totalCost = convertedLandedCost + customsDuty;

  // All remaining percentages are assumed to be based on
  // the final customer selling price.
  const platformRate = inputs.platformFeeRate / 100;
  const paymentRate = inputs.paymentFeeRate / 100;
  const taxRate = inputs.taxRate / 100;
  const marginRate = inputs.desiredProfitMargin / 100;

  const denominator =
    1 - platformRate - paymentRate - taxRate - marginRate;

  if (denominator <= 0) {
    throw new Error(
      "Combined fees, tax and profit margin must be less than 100%.",
    );
  }

  const recommendedPrice = totalCost / denominator;

  const platformFee = recommendedPrice * platformRate;
  const paymentFee = recommendedPrice * paymentRate;
  const tax = recommendedPrice * taxRate;
  const profit = recommendedPrice * marginRate;

  return {
    sourceCost: round(sourceCost),
    convertedLandedCost: round(convertedLandedCost),
    customsDuty: round(customsDuty),
    totalCost: round(totalCost),
    platformFee: round(platformFee),
    paymentFee: round(paymentFee),
    tax: round(tax),
    profit: round(profit),
    recommendedPrice: round(recommendedPrice),
    effectiveProfitMargin: round(
      (profit / recommendedPrice) * 100,
      2,
    ),
  };
}
