import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../../context/AuthContext';

function Probe() {
  const { user, login } = useAuth();
  React.useEffect(() => { login?.('bhupinder@example.com', 'pass123'); }, [login]);
  return <>{user ? <></> : <></>}</>;
}

test('login sets user', async () => {
  let currentUser = null;
  function Tap() {
    const { user } = useAuth();
    currentUser = user;
    return null;
  }

  render(
    <AuthProvider>
      <Tap />
      <Probe />
    </AuthProvider>
  );

  await waitFor(() => {
    expect(currentUser).not.toBeNull();
  });
});
