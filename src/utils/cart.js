import { MAX_QUANTITY, normalizeSelection } from '../data/options';
import { getProduct } from './pricing';

export function makeLine(productId, input, quantity = 1) {
  getProduct(productId);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    throw new Error(`Choose a quantity between 1 and ${MAX_QUANTITY}.`);
  }
  const selection = normalizeSelection(input);
  return { id: `${productId}:${JSON.stringify(selection)}`, productId, selection, quantity };
}

export function addLine(lines, incoming) {
  const existing = lines.find((line) => line.id === incoming.id);
  if (!existing) return [...lines, incoming];
  const merged = makeLine(
    incoming.productId,
    incoming.selection,
    existing.quantity + incoming.quantity,
  );
  return lines.map((line) => (line.id === merged.id ? merged : line));
}

export function editLine(lines, sourceId, selection, quantity) {
  const source = lines.find((line) => line.id === sourceId);
  if (!source) throw new Error('This cart item has changed. Please reopen it.');
  const edited = makeLine(source.productId, selection, quantity ?? source.quantity);
  if (edited.id === sourceId) return lines.map((line) => (line.id === sourceId ? edited : line));
  return addLine(
    lines.filter((line) => line.id !== sourceId),
    edited,
  );
}
