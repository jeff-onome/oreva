# E-commerce Platform Documentation (ORESKY)

## 1. Introduction

Welcome to the ORESKY E-commerce Platform documentation. This document provides a comprehensive overview of the application's architecture, technologies, and file structure. It is intended for developers to quickly get up to speed with the codebase, understand how different parts of the system interact, and easily debug potential issues.

The application is a vibrant, fully-featured e-commerce platform built with a modern tech stack. It includes product listings, a multi-category system, a shopping cart with coupon support, secure checkout, and a complete user account section (profile, orders, wishlists, reviews, support). It also features a powerful admin dashboard for managing products, orders, users, promotions, and all dynamic site content.

---

## 2. Tech Stack

The project utilizes a modern stack for both frontend and backend development.

-   **Frontend:**
    -   **Framework:** React 18
    -   **Build Tool:** Vite
    -   **Routing:** React Router (`react-router-dom`)
    -   **Styling:** Tailwind CSS with a dynamic theming system
    -   **Language:** TypeScript
    -   **Icons:** Lucide React

-   **Backend (Platform as a Service):**
    -   **Provider:** Google Firebase
    -   **Database:** Realtime Database (JSON-based NoSQL)
    -   **Authentication:** Firebase Authentication (handles user sessions)
    -   **Storage:** Firebase Storage (for product images, user avatars, and site assets)
    -   **API:** All interactions are handled via the `firebase` client SDK.

---

## 3. Project Structure

The project follows a standard Vite + React structure. The core application logic resides within the `/src` directory.

```
/
├── public/
├── src/
│   ├── components/      # Reusable UI components (Button, InputField, etc.)
│   ├── context/         # React Context providers for global state management
│   ├── pages/           # Route-level components (HomePage, ProductsPage, etc.)
│   │   ├── account/     # Pages for logged-in user accounts (Profile, Orders, etc.)
│   │   └── admin/       # Pages for the admin dashboard (Dashboard, Products, etc.)
│   ├── utils/           # Utility functions (formatters, Firebase client)
│   ├── App.tsx          # Main application component with routing setup
│   ├── index.css        # Global styles and Tailwind CSS setup
│   ├── index.tsx        # Application entry point
│   └── types.ts         # TypeScript type definitions for the project
├── INFO.md              # This documentation file
├── tailwind.config.js   # Tailwind CSS configuration
└── vite.config.ts       # Vite build tool configuration
```

---

## 4. Frontend Architecture

### Routing
Routing is handled by `react-router-dom` using `HashRouter`. All routes are defined in `src/App.tsx`. The routes are categorized as:
-   **Public Routes:** Accessible to all visitors (e.g., `/`, `/products`, `/about`).
-   **Protected Routes:** Require user authentication (e.g., `/checkout`, `/account`). This is enforced by the `ProtectedRoute` component.
-   **Admin Routes:** Require authenticated users who are also admins (e.g., `/admin`). `ProtectedRoute` handles this with the `adminOnly` prop.

### State Management
Global state is managed using React's Context API to avoid prop drilling.
-   **`AuthContext`:** Manages user authentication state, session data, and provides `login`, `logout`, and `signUp` functions, all integrated with Firebase Auth. It also fetches the user's profile from the Realtime Database upon login.
-   **`CartContext`:** Manages the shopping cart's state, including items, quantities, totals, and coupon application logic.
-   **`ToastContext`:** Manages the display of site-wide toast notifications for user feedback.
-   **`SiteSettingsContext`:** Fetches and provides global site settings (like site name, theme colors, hero slides) from a dedicated node in the Realtime Database.

### Key Features
-   **Dynamic Theming:** Admins can change the site's primary, secondary, and accent colors via the dashboard. The `ThemeManager` component applies these colors globally using CSS variables.
-   **Dynamic Content Management:** Admins can control homepage content (Hero Slider, Flash Sales) and other pages (About, Contact) directly from the admin dashboard, with all data stored in the Realtime Database.
-   **Comprehensive User Account:** A full suite of features including profile management, detailed order history, address/payment management, wishlists, and a support ticket system.
-   **Full-Fledged Admin Dashboard:** A central hub for managing all aspects of the e-commerce store, including products, orders, users, promotions, and all dynamic site content stored in the Realtime Database.

---

## 5. Backend Architecture (Firebase)

The entire backend is powered by Firebase, providing a scalable and secure "Backend as a Service".

### Database (Realtime Database)
The application uses a NoSQL, JSON-based database. Data is organized as a large JSON tree.

-   **Key Nodes:**
    -   `users/{uid}`: Stores public user data, notification preferences, and the `isAdmin` flag. The key `{uid}` matches the Firebase Auth UID.
    -   `products`: Stores all product information as a collection of objects.
    -   `categories`: Stores product categories.
    -   `orders`: Contains all order information.
    -   `reviews`: User-submitted product reviews, with an `isApproved` flag for moderation.
    -   `coupons`: Stores discount codes.
    -   `supportTickets`: Stores all customer support requests.
    -   `site_settings`: A key-value store for dynamic site configuration.
    -   **Nested Data:** Features like `addresses`, `paymentMethods`, and `wishlist` are stored as nested objects under each `users/{uid}` node for data co-location.

### Authentication
Firebase Authentication handles all user management.
-   **Security Rules:** The Realtime Database is secured by a JSON-based rules file (`database.rules.json`). These rules ensure that:
    -   Users can only read/write their own data nodes (e.g., a user can only access `/users/{uid}` if `auth.uid` matches `{uid}`).
    -   Public data like products and categories is readable by anyone.
    -   Admin-only actions are restricted to users with an `isAdmin: true` flag in their user data, which is checked via `root.child('users').child(auth.uid).child('isAdmin').val() === true`.
-   **Auth-Profile Sync:** When a new user signs up via Firebase Auth, the `AuthContext`'s `signUp` function programmatically creates a corresponding node for them in the `users` path in the database.

### Storage
Firebase Storage is used to host images and assets.
-   **Folders:** Storage is organized by folders.
    -   `product_images`: Publicly accessible folder for all product imagery.
    -   `profile_pictures`: For user avatars. Security rules can be set to ensure users can only write to their own path (e.g., `/profile_pictures/{userId}/...`).
    -   `site_images`: For general site assets, such as hero slider images, managed by admins.

---

## 6. Debugging Guide

-   **"Firebase App is not initialized"**:
    -   **Cause:** The Firebase config environment variables (`VITE_FIREBASE_*`) are missing or incorrect in your `.env.local` file.
    -   **Debug:** Ensure all required Firebase config keys are present and correct in your environment file. Check `src/utils/firebase.ts` for the list of required variables.

-   **"Permission denied"**:
    -   **Cause:** A database query is being denied by your Realtime Database Security Rules.
    -   **Debug:** Open the Firebase Console and use the Rules Playground to simulate the read/write operation that's failing. Check the user's authentication state and the specific path they are trying to access. Adjust your security rules in `database.rules.json` accordingly.

-   **Data Not Appearing:**
    -   **Cause:** The query path might be incorrect, the user may not have permission, or the data structure in the database doesn't match what the code expects.
    -   **Debug:** Use `console.log` to inspect the snapshots returned from database queries (`snapshot.val()`). Check the Firebase Console to ensure the data exists at the expected path and has the correct structure.

-   **Admin Actions Failing:**
    -   **Cause:** The logged-in user does not have `isAdmin: true` set in their user node at `/users/{uid}`.
    -   **Debug:** Manually edit the user's data in the Realtime Database console to set `isAdmin` to `true`. The user must log out and log back in for the `AuthContext` to re-fetch their profile with the updated admin status.
