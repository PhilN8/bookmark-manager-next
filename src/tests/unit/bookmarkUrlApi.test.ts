// Unit tests for URL sub-resource API wrappers
// These test the api.ts wrapper functions in isolation

describe("bookmarkApi URL helpers", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("addUrl sends POST to /api/bookmarks/:id/urls", async () => {
    const mockUrl = { id: "url-1", url: "https://new.com", isPrimary: false, label: null };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockUrl,
    });

    const { bookmarkApi } = await import("@/lib/api");
    const result = await bookmarkApi.addUrl("bm-1", {
      url: "https://new.com",
      isPrimary: false,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/bookmarks/bm-1/urls",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://new.com", isPrimary: false }),
      }),
    );
    expect(result).toEqual(mockUrl);
  });

  it("removeUrl sends DELETE to /api/bookmarks/:id/urls/:urlId and resolves on 204", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => { throw new Error("no body"); },
    });

    const { bookmarkApi } = await import("@/lib/api");
    await expect(bookmarkApi.removeUrl("bm-1", "url-1")).resolves.toBeUndefined();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/bookmarks/bm-1/urls/url-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("removeUrl throws on non-ok, non-204 response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "Cannot remove the last URL from a bookmark" }),
    });

    const { bookmarkApi } = await import("@/lib/api");
    await expect(bookmarkApi.removeUrl("bm-1", "url-1")).rejects.toThrow(
      "Cannot remove the last URL from a bookmark",
    );
  });
});
