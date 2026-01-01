// Mock React Native globally
jest.mock('react-native', () => ({
  NativeModules: {
    RNGestureHandlerModule: {
      State: {},
      Directions: {},
      default: {},
    },
    RNCNetInfo: {
      getCurrentState: jest.fn(() => Promise.resolve({
        type: 'wifi',
        isConnected: true,
        details: { isConnectionExpensive: false }
      })),
      addListener: jest.fn(),
      removeListeners: jest.fn(),
    },
  },
  Platform: {
    OS: 'ios',
    select: jest.fn(),
  },
}));

// Mock @testing-library/jest-native
jest.mock('@testing-library/jest-native/extend-expect', () => ({}));

// React Native modules are now mocked above

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
  multiSet: jest.fn(),
  multiGet: jest.fn(),
}));

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock SQLite
jest.mock('expo-sqlite', () => ({
  SQLiteDatabase: jest.fn(() => ({
    exec: jest.fn(),
    run: jest.fn(),
    getAll: jest.fn(),
    getFirst: jest.fn(),
  })),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: jest.fn(() => ({
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
  })),
  fetch: jest.fn(() => Promise.resolve({
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
  })),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
  usePathname: () => '/',
  useSegments: () => [],
}));

// Mock expo-font
jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  loadAsync: jest.fn(),
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: {
    manifest: {
      extra: {
        API_URL: 'http://localhost:3000/api',
      },
    },
  },
}));

// Mock react-native-paper
jest.mock('react-native-paper', () => ({
  Provider: ({ children }) => children,
  Button: ({ children, onPress, ...props }) => ({
    type: 'TouchableOpacity',
    props: { onPress, ...props, children },
  }),
  Text: ({ children, ...props }) => ({
    type: 'Text',
    props: { ...props, children },
  }),
  Card: ({ children, ...props }) => ({
    type: 'View',
    props: { ...props, children },
  }),
  IconButton: ({ onPress, ...props }) => ({
    type: 'TouchableOpacity',
    props: { onPress, ...props, children: 'Icon' },
  }),
  Snackbar: ({ children, visible }) =>
    visible ? { type: 'View', props: { children } } : null,
  ActivityIndicator: () => ({ type: 'Text', props: { children: 'Loading...' } }),
  DefaultTheme: {
    colors: {
      primary: '#6200ee',
      accent: '#03dac4',
    },
  },
}));

// Mock react-navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    push: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
    name: 'TestScreen',
  }),
  useFocusEffect: jest.fn(),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: ({ name, size, color }) => ({
    type: 'Text',
    props: {
      style: { fontSize: size, color },
      children: name,
    },
  }),
}));

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

// Global test utilities
global.fetch = jest.fn();

global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  debug: jest.fn(),
};

// Mock performance
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
};

global.performance = mockPerformance;

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  fetch.mockClear();
});

// Cleanup after each test
afterEach(() => {
  jest.restoreAllMocks();
});