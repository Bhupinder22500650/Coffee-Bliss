# Coffee Bliss ☕ (Expo + React Native)

A premium, cross-platform mobile application built with **React Native** and **Expo**. Coffee Bliss offers a sleek, high-end experience for coffee lovers to browse, customize, and order their favorite brews.

---

## ✨ Features

- **🔐 Secure Authentication**: Mock login and signup system with persistent sessions using `AsyncStorage`.
- **☕ Dynamic Coffee Menu**: Browse a rich variety of coffee options loaded from a structured local JSON database.
- **🔍 Advanced Search & Filter**: Instant search with debouncing, category filtering (Latte, Espresso, etc.), and sorting by popularity or price.
- **🎨 Deep Customization**: Fine-tune your drink with options for size, milk types, and sugar levels.
- **🛒 Smart Cart Management**: Real-time pricing calculations, including add-ons, with an intuitive cart UI.
- **📜 Order History**: View your past orders with detailed digital receipts and status tracking.
- **📳 Haptic Feedback**: Integrated `expo-haptics` for a tactile, premium feel during interactions.
- **🌗 Stunning Dark Theme**: A custom-designed coffee-themed interface (Espresso, Cream, and Caramel palette).

---

## 🏗 Architecture & Directory Structure

The project follows a **Modular Component Architecture**, ensuring high reusability, easy testing, and clean separation of concerns.

```text
.
├── App.js                 # Entry point proxy (delegates to src/App.js)
├── app.json               # Expo configuration
├── assets/                # Static assets (images, fonts, splash)
├── src/
│   ├── App.js             # Core Application logic & Navigation setup
│   ├── components/        # Reusable UI components (CoffeeCard, QuantitySelector, etc.)
│   ├── screens/           # Main application screens (Home, Cart, Profile, etc.)
│   ├── context/           # Global state management (AuthContext)
│   ├── data/              # Static data & JSON databases (menu.json)
│   ├── utils/             # Helper functions and business logic (pricing, storage keys)
│   ├── test-utils/        # Test setup, providers, and environment seeds
│   ├── __tests__/         # Centralized test suites (Unit & Integration)
│   └── __mocks__/         # Native module mocks for Jest
└── package.json           # Project dependencies and scripts
```

### Key Architectural Decisions:
- **Proxy Entry Pattern**: A root `App.js` points to `src/App.js`, keeping the root directory clean while maintaining Expo compatibility.
- **Context API**: Used for global state (Authentication) to avoid prop drilling.
- **Separated Business Logic**: Pricing logic and storage keys are moved to `utils/` for better testability and maintenance.
- **Centralized Testing**: All tests are located in `src/__tests__` following a structure that mirrors the source code.

---

## 🛠 Tech Stack

- **Framework**: [Expo](https://expo.dev/) + [React Native](https://reactnative.dev/)
- **Navigation**: [React Navigation](https://reactnavigation.org/) (Stack & Bottom Tabs)
- **State Management**: React Context API
- **Persistence**: `@react-native-async-storage/async-storage`
- **Styling**: Vanilla React Native StyleSheet with a custom design system
- **Testing**: [Jest](https://jestjs.io/) + [React Testing Library](https://testing-library.com/docs/react-native-testing-library/intro/)
- **Icons**: `@expo/vector-icons` (Ionicons)

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (LTS)
- [Expo Go](https://expo.dev/client) app on your mobile device

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Bhupinder22500650/Coffee-Bliss.git

# Navigate to project
cd Coffee-Bliss

# Install dependencies
npm install
```

### 3. Running the App
```bash
# Start the Expo development server
npx expo start
```
Scan the QR code with **Expo Go** (Android) or the **Camera app** (iOS).

---

## 🧪 Testing

The project uses **Jest** and **React Testing Library** for robust testing.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch
```

Test coverage includes:
- **Unit Tests**: Pricing logic, utility functions.
- **Component Tests**: Interaction testing for buttons and selectors.
- **Navigation Tests**: Ensuring screen transitions and auth flows work as expected.

---

## 📝 License
This project is for educational purposes. All coffee imagery and descriptions are mock data.
