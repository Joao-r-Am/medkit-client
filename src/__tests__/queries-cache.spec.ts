import { beforeEach, describe, expect, it, vi } from "vitest";
import { cached, clearCache } from "@/services/queries";

describe("services/queries cache", () => {
  beforeEach(() => {
    clearCache();
  });

  it("deduplica chamadas iguais dentro do TTL", async () => {
    const fetcher = vi.fn().mockResolvedValue("dado");

    const [first, second] = await Promise.all([
      cached("cache:dedupe", fetcher),
      cached("cache:dedupe", fetcher)
    ]);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(first).toBe("dado");
    expect(second).toBe("dado");
  });

  it("clearCache descarta tudo e força nova consulta", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce("clínica antiga")
      .mockResolvedValueOnce("clínica nova");

    await expect(cached("cache:clinic", fetcher)).resolves.toBe(
      "clínica antiga"
    );

    clearCache();

    await expect(cached("cache:clinic", fetcher)).resolves.toBe("clínica nova");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("erro não fica em cache", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error("falhou"))
      .mockResolvedValueOnce("ok");

    await expect(cached("cache:error", fetcher)).rejects.toThrow("falhou");
    await expect(cached("cache:error", fetcher)).resolves.toBe("ok");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
