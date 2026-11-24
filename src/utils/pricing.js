import menu from '../data/menu.json';
import { OPTION_GROUPS, TOPPINGS, normalizeSelection } from '../data/options';

export const formatMoney = (cents) => `$${(cents / 100).toFixed(2)}`;

export function getProduct(productId) {
  const product = menu.find((item) => item.id === productId);
  if (!product) throw new Error('This coffee is no longer on the menu.');
  return product;
}

export function unitPriceCents(productId, input) {
  const selection = normalizeSelection(input);
  const options = OPTION_GROUPS.reduce(
    (sum, group) => sum + group.choices.find(([name]) => name === selection[group.key])[1],
    0,
  );
  const toppings = selection.toppings.reduce(
    (sum, value) => sum + TOPPINGS.find(([name]) => name === value)[1],
    0,
  );
  return Math.max(0, getProduct(productId).priceCents + options + toppings);
}

export function priceLine(line) {
  const product = getProduct(line.productId);
  const unitCents = unitPriceCents(line.productId, line.selection);
  return { ...line, name: product.name, unitCents, totalCents: unitCents * line.quantity };
}

export function cartPricing(lines) {
  const pricedLines = lines.map(priceLine);
  const subtotalCents = pricedLines.reduce((sum, line) => sum + line.totalCents, 0);
  const gstCents = Math.round((subtotalCents * 15) / 100);
  return {
    lines: pricedLines,
    subtotalCents,
    gstCents,
    totalCents: subtotalCents + gstCents,
    itemCount: pricedLines.reduce((sum, line) => sum + line.quantity, 0),
  };
}
