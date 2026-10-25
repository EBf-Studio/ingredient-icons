const cache = new Map<string, Promise<unknown>>();

/**
 * Fetches a JSON file once per page load and shares the result. A failed request is
 * forgotten, so the next call tries again instead of repeating the failure.
 */
export function fetchJsonOnce<T>(url: string): Promise<T> {
  let promise = cache.get(url) as Promise<T> | undefined;
  if (!promise) {
    promise = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`${url}: ${response.status}`);
      return response.json() as Promise<T>;
    });
    promise.catch(() => cache.delete(url));
    cache.set(url, promise);
  }
  return promise;
}
