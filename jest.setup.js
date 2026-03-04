import "@testing-library/jest-dom";

// Mock ResizeObserver for shadcn/ui components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
