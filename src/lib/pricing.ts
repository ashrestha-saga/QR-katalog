export type LineTotals = {
  quantity: number;
  unitPriceExclTax: number;
  taxRate: number;
  subtotalExclTax: number;
  taxAmount: number;
  totalInclTax: number;
};

export function calcLineTotals(
  quantity: number,
  unitPriceExclTax: number,
  taxRate: number
): LineTotals {
  const qty = Math.max(1, Math.floor(quantity));
  const subtotalExclTax = roundMoney(qty * unitPriceExclTax);
  const taxAmount = roundMoney(subtotalExclTax * taxRate);
  const totalInclTax = roundMoney(subtotalExclTax + taxAmount);

  return {
    quantity: qty,
    unitPriceExclTax,
    taxRate,
    subtotalExclTax,
    taxAmount,
    totalInclTax,
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatEur(amount: number): string {
  return new Intl.NumberFormat("en-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatTaxRate(rate: number): string {
  return `${Math.round(rate * 100)}% VAT`;
}

export type BasketLineInput = {
  quantity: number;
  unitPriceExclTax: number;
  taxRate: number;
};

export function calcBasketTotals(lines: BasketLineInput[]): {
  subtotalExclTax: number;
  taxAmount: number;
  totalInclTax: number;
  itemCount: number;
} {
  let subtotalExclTax = 0;
  let taxAmount = 0;
  let itemCount = 0;

  for (const line of lines) {
    const lineTotals = calcLineTotals(
      line.quantity,
      line.unitPriceExclTax,
      line.taxRate
    );
    subtotalExclTax += lineTotals.subtotalExclTax;
    taxAmount += lineTotals.taxAmount;
    itemCount += lineTotals.quantity;
  }

  return {
    subtotalExclTax: roundMoney(subtotalExclTax),
    taxAmount: roundMoney(taxAmount),
    totalInclTax: roundMoney(subtotalExclTax + taxAmount),
    itemCount,
  };
}

/** Germany shipping (net) from basket net goods total. */
export function calcGermanyShippingNet(subtotalExclTax: number): number {
  if (subtotalExclTax <= 0) return 0;
  if (subtotalExclTax <= 30) return 12.9; // €7.90 + €5
  if (subtotalExclTax <= 100) return 7.9;
  return 0;
}

export function calcBasketTotalsWithShipping(
  lines: BasketLineInput[],
  shippingTaxRate = 0.19
): {
  subtotalExclTax: number;
  shippingNet: number;
  goodsTaxAmount: number;
  shippingTaxAmount: number;
  taxAmount: number;
  totalInclTax: number;
  itemCount: number;
} {
  const basket = calcBasketTotals(lines);
  const shippingNet = calcGermanyShippingNet(basket.subtotalExclTax);
  const shippingTaxAmount = roundMoney(shippingNet * shippingTaxRate);
  const taxAmount = roundMoney(basket.taxAmount + shippingTaxAmount);

  return {
    subtotalExclTax: basket.subtotalExclTax,
    shippingNet,
    goodsTaxAmount: basket.taxAmount,
    shippingTaxAmount,
    taxAmount,
    totalInclTax: roundMoney(
      basket.subtotalExclTax + shippingNet + taxAmount
    ),
    itemCount: basket.itemCount,
  };
}
