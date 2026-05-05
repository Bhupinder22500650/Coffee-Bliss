import React from 'react';
import { render } from '@testing-library/react-native';
import CoffeeCard from '../../components/CoffeeCard';

describe('CoffeeCard', () => {
  test('renders name and price', () => {
    const item = { id: 'latte', name: 'Latte', price: 5.0, image: '' };
    const { getByText } = render(<CoffeeCard item={item} onAdd={() => {}} />);
    expect(getByText('Latte')).toBeTruthy();
    expect(getByText(/\$?\s*5(\.00)?/)).toBeTruthy();
  });
});
