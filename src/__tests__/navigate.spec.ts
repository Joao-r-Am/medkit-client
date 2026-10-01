import { beforeEach, describe, expect, it, vi } from "vitest";
import { currentRouteMock, pushMock } from "@/__tests__/setup";
import { prefetchRoute } from "@/services/queries";
import { useNavigate } from "@/utils/navigate";

/*
 * A navegação é imediata: o clique chama `router.push` sem esperar o dado da
 * página de destino. O prefetch roda em background só para aquecer o cache e
 * acender a barra do topo no clique.
 */
vi.mock("@/services/queries", () => ({
  prefetchRoute: vi.fn()
}));

beforeEach(() => {
  pushMock.mockClear();
  vi.mocked(prefetchRoute).mockReset().mockResolvedValue(undefined);
  currentRouteMock.value = { path: "/" };
});

describe("useNavigate — navegação imediata", () => {
  it("navega na hora, sem aguardar o prefetch", () => {
    // Prefetch que nunca resolve: se a navegação esperasse por ele, o push
    // jamais seria chamado dentro deste teste.
    vi.mocked(prefetchRoute).mockReturnValue(new Promise(() => undefined));

    const { navigate } = useNavigate();
    navigate("/patients");

    expect(pushMock).toHaveBeenCalledWith("/patients");
  });

  it("dispara o prefetch em background para aquecer o cache", () => {
    const { navigate } = useNavigate();
    navigate("/appointments");

    expect(prefetchRoute).toHaveBeenCalledWith("/appointments");
    expect(pushMock).toHaveBeenCalledWith("/appointments");
  });

  it("não navega nem prefaz quando já está no caminho", () => {
    currentRouteMock.value = { path: "/patients" };

    const { navigate } = useNavigate();
    navigate("/patients");

    expect(prefetchRoute).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("falha no prefetch não impede a navegação", () => {
    // O erro é tratado pela página de destino no onMounted; aqui ele não pode
    // virar exceção nem engolir o push.
    vi.mocked(prefetchRoute).mockRejectedValue(new Error("offline"));

    const { navigate } = useNavigate();
    navigate("/credentials");

    expect(pushMock).toHaveBeenCalledWith("/credentials");
  });
});
