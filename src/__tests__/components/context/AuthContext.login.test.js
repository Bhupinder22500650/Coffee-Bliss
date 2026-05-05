import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../../context/AuthContext';


test('login sets user', async () => {
  let loginFn = null;
  let currentUser = null;

  function Consumer() {
    const { user, login } = useAuth();
    currentUser = user;
    loginFn = login;
    return null;
  }

  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>
  );

  // Trigger login manually
  await waitFor(() => expect(loginFn).toBeTruthy());
  
  await act(async () => {
    await loginFn('bhupinder@example.com', 'pass123');
  });

  await waitFor(() => {
    expect(currentUser).not.toBeNull();
    expect(currentUser.email).toBe('bhupinder@example.com');
  });
});
