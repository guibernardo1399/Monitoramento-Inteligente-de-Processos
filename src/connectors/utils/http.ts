export async function fetchJson<T>(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs || 15000);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status} ao consultar ${url}: ${text.slice(0, 300)}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`A consulta excedeu o tempo limite ao acessar ${url}.`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
