// ========== Jest RN Stable Test Setup ==========

// ---- Stable Platform (so .select exists) ----------
jest.mock('react-native/Libraries/Utilities/Platform', () => {
  const actual = jest.requireActual('react-native/Libraries/Utilities/Platform');
  return {
    ...actual,
    OS: 'ios',
    Version: 16,
    isPad: false,
    isTV: false,
    select: actual.select,
  };
});

// ---- Kill DevMenu/TurboModule in Jest -------------
jest.mock('react-native/src/private/devsupport/devmenu/DevMenu', () => ({}), { virtual: true });
jest.mock('react-native/Libraries/DevMenu/DevMenu', () => ({}), { virtual: true });

// ---- Safe Area: single provider + hook mock -------
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }) => React.createElement(View, null, children),
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: { top: 0, right: 0, bottom: 0, left: 0 },
    },
  };
});

// ---- Navigation: light native-stack shim ----------
jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }) => React.createElement(React.Fragment, null, children),
      Screen: ({ children }) => React.createElement(React.Fragment, null, children),
    }),
  };
});

// ---- Gesture handler (no native deps) --------------
jest.mock('react-native-gesture-handler', () => {
  const RN = require('react-native');
  return {
    ...RN,
    GestureHandlerRootView: ({ children }) => children,
    PanGestureHandler: ({ children }) => children,
    TapGestureHandler: ({ children }) => children,
    LongPressGestureHandler: ({ children }) => children,
    State: {},
  };
}, { virtual: true });

// ---- Reanimated mock (official) -------------------
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// ---- Icons + Haptics to no-ops --------------------
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Mock = (props) => React.createElement(View, props);
  return { Ionicons: Mock };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' },
}));

// ---- DO NOT mock the whole 'react-native' package --
// (This causes the Platform.OS undefined loop via Modal)

// ---- Optional: silence native animated warnings ----
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// ---- Tiny async flush helper -----------------------
global.flushAllPromises = () => new Promise((r) => setImmediate(r));
