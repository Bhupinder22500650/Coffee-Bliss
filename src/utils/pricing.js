export function lineSubtotal(basePrice, qty = 1, addOns = []) {
  const addOnsTotal = (addOns || []).reduce((sum, a) => sum + (a.price || 0), 0);
  return (basePrice + addOnsTotal) * (qty || 1);
}

export function cartTotal(lines = []) {
  return lines.reduce((sum, l) => {
    return sum + lineSubtotal(l.price, l.qty, l.addOns);
  }, 0);
}
