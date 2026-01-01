import { vi } from 'vitest';

/**
 * Mock external services and APIs for testing
 */

// Mock fetch for API calls
export const mockFetch = (responseData: any, status: number = 200) => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(responseData),
      text: () => Promise.resolve(JSON.stringify(responseData)),
      headers: new Headers({ 'content-type': 'application/json' }),
    } as Response)
  );
};

// Mock failed fetch
export const mockFetchError = (error: any = 'Network error') => {
  global.fetch = vi.fn(() => Promise.reject(error));
};

// Mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
      get length() {
        return Object.keys(store).length;
      },
    },
    writable: true,
  });
};

// Mock sessionStorage
export const mockSessionStorage = () => {
  const store: Record<string, string> = {};

  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
      get length() {
        return Object.keys(store).length;
      },
    },
    writable: true,
  });
};

// Mock console methods to reduce noise in tests
export const mockConsole = () => {
  const originalConsole = { ...console };

  beforeEach(() => {
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    console.info = vi.fn();
    console.debug = vi.fn();
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
  });
};

// Mock timers
export const mockTimers = () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
};

// Mock IntersectionObserver
export const mockIntersectionObserver = () => {
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
};

// Mock ResizeObserver
export const mockResizeObserver = () => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
};

// Mock matchMedia
export const mockMatchMedia = (matches: boolean = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// Mock geolocation
export const mockGeolocation = (position: {
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
} = { coords: { latitude: 0, longitude: 0, accuracy: 100 } }) => {
  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: vi.fn().mockImplementation(success =>
        success(position)
      ),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    },
    writable: true,
  });
};

// Mock Notification API
export const mockNotifications = (permission: 'granted' | 'denied' | 'default' = 'granted') => {
  Object.defineProperty(window, 'Notification', {
    value: {
      permission,
      requestPermission: vi.fn().mockResolvedValue(permission),
    },
    writable: true,
  });
};

// Mock WebSocket
export const mockWebSocket = () => {
  global.WebSocket = vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
    readyState: 1, // OPEN
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
  })) as any;
};

// Mock File API
export const createMockFile = (
  name: string = 'test.txt',
  size: number = 1024,
  type: string = 'text/plain'
): File => {
  return new File(['test content'], name, { type });
};

// Mock FormData
export const mockFormData = () => {
  global.FormData = vi.fn().mockImplementation(() => ({
    append: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
    has: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    forEach: vi.fn(),
  }));
};

// Mock URL.createObjectURL
export const mockCreateObjectURL = () => {
  global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
  global.URL.revokeObjectURL = vi.fn();
};

// Setup all common mocks
export const setupCommonMocks = () => {
  mockLocalStorage();
  mockSessionStorage();
  mockIntersectionObserver();
  mockResizeObserver();
  mockMatchMedia();
  mockGeolocation();
  mockNotifications();
  mockWebSocket();
  mockFormData();
  mockCreateObjectURL();
};

// Mock Prisma client for unit tests
export const mockPrismaClient = () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    // Add other models as needed
  };

  return mockPrisma;
};

// Mock Next.js router
export const mockNextRouter = () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    locale: 'en',
    locales: ['en'],
    defaultLocale: 'en',
  };

  return mockRouter;
};

// Mock React hooks
export const mockReactHooks = () => {
  // Mock useRouter
  vi.mock('next/navigation', () => ({
    useRouter: () => mockNextRouter(),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/',
  }));

  // Mock useAuth context
  vi.mock('@/contexts/auth.context', () => ({
    useAuth: () => ({
      user: { id: '1', email: 'test@example.com' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      hasPermission: vi.fn(() => true),
    }),
  }));
};