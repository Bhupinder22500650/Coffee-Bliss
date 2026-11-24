# Coffee Bliss

A local coffee ordering app built with React Native and Expo. Choose a profile, customize drinks, manage a cart, and save orders with receipts. The same code runs on web, Android, and iOS.

Profiles and orders are stored on the current device or browser. There are no passwords, backend services, payment collection, or café connections. Running the app locally requires no paid service or API key.

## Get started

Use a supported Node.js version: 22.13+, 24.3+, or 26+.

```sh
npm ci
npm run web
```

Create a local profile on the first screen. Your cart and order history are saved automatically after each successful change.

Other commands:

| Command           | Purpose                                                    |
| ----------------- | ---------------------------------------------------------- |
| `npm start`       | Start Expo and connect a compatible Expo Go installation   |
| `npm run android` | Build and run locally with the Android SDK                 |
| `npm run ios`     | Build and run locally with Xcode on macOS                  |
| `npm run build`   | Export web, Android, and iOS JavaScript bundles to `dist/` |

The app uses Expo SDK 58, React Native 0.88, and React 19.3. A phone running Expo Go must support this SDK. Native builds require the corresponding local platform tools. Exporting bundles does not install or validate a native binary on a phone.

If Metro has cached an earlier version, run `npm start -- --clear`. Expo setup help is available in the [official documentation](https://docs.expo.dev/get-started/start-developing/).

## User flow

1. Create or select a local profile.
2. Search the menu, filter by category, or sort by name and price.
3. Choose a coffee, options, toppings, and quantity.
4. Add it to your cart. Identical configurations merge automatically.
5. Edit, remove, or clear cart items, then review the order.
6. Save the order and open its receipt or reorder from history.
7. Switch profiles from the Profile tab. Each profile has its own cart and orders.

Prices are in NZD. Menu prices exclude GST; the cart and checkout both show subtotal, 15% GST, and the final total. Money is calculated in integer cents with half-up rounding. For example, a $4.50 latte has $0.68 GST and a $5.18 total. Quantities are limited to 1–99 per configuration.

## Code map

| Location                    | Responsibility                                                    |
| --------------------------- | ----------------------------------------------------------------- |
| `src/App.js`                | Providers, stack navigation, and tabs                             |
| `src/screens/`              | Screens and temporary input state                                 |
| `src/components/`           | Shared controls, option form, confirmation dialogs, and layout    |
| `src/context/AppContext.js` | Saved application state, pending actions, and error feedback      |
| `src/data/menu.json`        | Menu items and base prices in cents                               |
| `src/data/options.js`       | Allowed options, defaults, and extra prices in cents              |
| `src/utils/pricing.js`      | Shared price and total calculations                               |
| `src/utils/cart.js`         | Cart identity, quantity validation, and merging                   |
| `src/storage/`              | Serialized writes, saved-data validation, migration, and recovery |
| `src/theme.js`              | Existing palette and common styles                                |

To add a coffee, give it a unique ID, description, category, and integer `priceCents` in `menu.json`. To change an option or surcharge, edit `options.js`; every screen uses the same rules. Keep persistent writes inside the repository rather than adding storage calls to screens.

## Local data and recovery

The app saves a versioned document under `cb_state_v2` in AsyncStorage. Checkout writes the saved order and cleared cart together. Requests are serialized, and repeated submissions for the same cart revision return the existing order. A failed write leaves the last confirmed state visible and provides an error message.

On the first launch after upgrading, the app imports recoverable older profiles, carts, and orders without copying passwords. Profiles whose old email keys collided are grouped into an imported shared profile. Unreadable entries are reported, and the original storage keys are left untouched for recovery.

If saved data cannot be read, use **Try again** or **Reset local data**. Reset requires confirmation and keeps a recovery copy under `cb_state_v2_backup` before starting fresh. It does not delete older version keys. Local profiles organize data; they do not provide authentication or protect access to the device.

Use one active app instance. Concurrent writes from several browser tabs and synchronization across devices are not supported.

## Verification

```sh
npm run build
npm ls --omit=dev --depth=0
npm audit --omit=dev
```

Walk through the [manual verification checklist](docs/VERIFICATION.md) after changing cart, pricing, navigation, or storage behavior. [Architecture notes](docs/ARCHITECTURE.md) explain the data model and update boundaries.

This is an educational project. The interface currently keeps its existing coffee palette; further visual design can be developed independently of the ordering flow.
