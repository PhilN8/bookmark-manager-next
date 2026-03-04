/** @jest-environment jsdom */

"use client";

import { act, renderHook } from "@testing-library/react";
import { useDebounce } from "@/lib/useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("returns initial value immediately", () => {
    const { result } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: "initial" },
    });

    expect(result.current).toBe("initial");
  });

  it("updates value only after delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "alpha", delay: 300 },
      },
    );

    rerender({ value: "beta", delay: 300 });

    expect(result.current).toBe("alpha");

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe("alpha");

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe("beta");
  });

  it("resets timer when value changes quickly", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "one", delay: 400 },
      },
    );

    rerender({ value: "two", delay: 400 });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    rerender({ value: "three", delay: 400 });

    act(() => {
      jest.advanceTimersByTime(399);
    });
    expect(result.current).toBe("one");

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe("three");
  });
});
