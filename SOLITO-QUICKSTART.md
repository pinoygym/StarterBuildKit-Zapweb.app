# Solito Monorepo - Quick Start Guide

## 🎉 Integration Complete!

Your project is now a **Solito-powered monorepo** with cross-platform capabilities.

## Running the Apps

### Web App (Next.js)
```bash
cd apps/web
bun run dev
```
**URL**: http://localhost:3000

### Mobile App (Expo)
```bash
cd apps/mobile
npx expo start
```
Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator  
- Scan QR code with Expo Go app on your phone

## Project Structure

```
StarterBuildKit-Zapweb.app/
├── apps/
│   ├── web/          # Next.js (your original app)
│   └── mobile/       # Expo React Native
├── packages/
│   └── app/          # Shared components
└── package.json      # Workspace config
```

## Creating Shared Components

### 1. Create Component
**File**: `packages/app/src/MyComponent.tsx`
```tsx
import { View, Text } from 'react-native';

export function MyComponent() {
  return (
    <View className="p-4 bg-blue-500">
      <Text className="text-white text-xl">
        Hello from Shared Component!
      </Text>
    </View>
  );
}
```

### 2. Use in Web
**File**: `apps/web/app/my-page/page.tsx`
```tsx
'use client'
import { MyComponent } from '@inventory-pro/app/src/MyComponent';

export default function MyPage() {
  return <MyComponent />;
}
```

### 3. Use in Mobile
**File**: `apps/mobile/App.tsx`
```tsx
import { MyComponent } from '@inventory-pro/app/src/MyComponent';

export default function App() {
  return <MyComponent />;
}
```

## Important Notes

### Styling
- ✅ Use **NativeWind** (Tailwind classes) for cross-platform styling
- ✅ Use **React Native primitives** (`View`, `Text`, `Image`, etc.)
- ❌ Don't use HTML tags (`div`, `p`, `span`) in shared components

### Navigation
- Use Solito's navigation hooks for cross-platform routing
- Web: Automatically uses Next.js routing
- Mobile: Uses React Navigation under the hood

### Dependencies
- Install shared dependencies in `packages/app/package.json`
- Install platform-specific deps in respective `apps/*/package.json`

## Example Shared Components

Located in `packages/app/src/`:
- **`Hello.tsx`** - Component with NativeWind styling
- **`Simple.tsx`** - Basic component without styling

## Test Pages

Located in `apps/web/app/`:
- **`/test`** - Basic test page
- **`/simple`** - Page with shared component
- **`/solito`** - Page with NativeWind component

## Troubleshooting

### Web server won't start
- Check `apps/web/.next` - delete and restart
- Run `bun install` in root directory

### Mobile app won't start
- Run `cd apps/mobile && npx expo start --clear`
- Check Metro bundler logs for errors

### Shared component not found
- Verify path: `@inventory-pro/app/src/ComponentName`
- Check `tsconfig.json` has correct path mappings
- Restart development servers

## Next Steps

1. ✅ Both servers running
2. 🔄 Test on Android/iOS device or emulator
3. 🔄 Create your first shared screen
4. 🔄 Implement cross-platform navigation
5. 🔄 Build and deploy!

---

**Need help?** Check the [walkthrough.md](file:///C:/Users/cyber/.gemini/antigravity/brain/604c59da-7de5-4591-8e40-cfec6da80a60/walkthrough.md) for detailed configuration info.
