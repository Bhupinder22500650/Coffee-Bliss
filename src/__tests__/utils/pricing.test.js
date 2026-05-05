import { lineSubtotal, cartTotal } from '../../utils/pricing';

test('lineSubtotal adds add-ons and multiplies by qty', () => {
  expect(lineSubtotal(5, 2, [{ price: 1 }, { price: 0.5 }])).toBe(13); // (5+1+0.5)*2
});

test('cartTotal sums multiple lines', () => {
  const lines = [
    { price: 5, qty: 1, addOns: [{ price: 1 }] }, // 6
    { price: 4, qty: 2, addOns: [] }              // 8
  ];
  expect(cartTotal(lines)).toBe(14);
});
