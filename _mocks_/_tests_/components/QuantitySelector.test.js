import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import QuantitySelector from '../../src/components/QuantitySelector';

test('increments and decrements (onChange fires)', () => {
  const onChange = jest.fn();
  const { getByLabelText } = render(<QuantitySelector initial={1} onChange={onChange} />);
  fireEvent.press(getByLabelText('Increase quantity'));
  fireEvent.press(getByLabelText('Decrease quantity'));
  expect(onChange).toHaveBeenCalledTimes(2);
});
