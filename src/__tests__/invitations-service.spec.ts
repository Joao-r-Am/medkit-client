import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();
const postMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("@/services/http", () => ({
  default: { get: getMock, post: postMock, delete: deleteMock }
}));

async function loadService() {
  const { default: invitations } = await import("@/services/invitations");
  return invitations;
}

describe("services/invitations", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    deleteMock.mockReset();
  });

  it("list busca os convites da clínica (filtro opcional por status)", async () => {
    const payload = [{ id: "i1", status: "pending" }];
    getMock.mockResolvedValue({ data: { data: payload } });

    const invitations = await loadService();

    await expect(invitations.list("c1")).resolves.toEqual(payload);
    expect(getMock).toHaveBeenLastCalledWith("/clinics/c1/invitations", {
      params: undefined
    });

    await invitations.list("c1", "pending");
    expect(getMock).toHaveBeenLastCalledWith("/clinics/c1/invitations", {
      params: { status: "pending" }
    });
  });

  it("create envia e-mail e papel para a clínica", async () => {
    postMock.mockResolvedValue({ data: { id: "i1", status: "pending" } });

    const invitations = await loadService();
    const result = await invitations.create("c1", {
      email: "novo@medkit.com",
      role_id: "r1"
    });

    expect(postMock).toHaveBeenCalledWith("/clinics/c1/invitations", {
      email: "novo@medkit.com",
      role_id: "r1"
    });
    expect(result.id).toBe("i1");
  });

  it("resend e revoke usam os endpoints do convite", async () => {
    postMock.mockResolvedValue({ data: { id: "i1" } });
    deleteMock.mockResolvedValue({ data: { id: "i1", status: "revoked" } });

    const invitations = await loadService();

    await invitations.resend("c1", "i1");
    expect(postMock).toHaveBeenCalledWith("/clinics/c1/invitations/i1/resend");

    const revoked = await invitations.revoke("c1", "i1");
    expect(deleteMock).toHaveBeenCalledWith("/clinics/c1/invitations/i1");
    expect(revoked.status).toBe("revoked");
  });

  it("preview e accept usam o token do link", async () => {
    getMock.mockResolvedValue({
      data: { clinic: { name: "Clínica X" }, email: "a@b.com" }
    });
    postMock.mockResolvedValue({
      data: { membership: { id: "m1" }, clinic: { id: "c1" } }
    });

    const invitations = await loadService();

    const preview = await invitations.preview("tok");
    expect(getMock).toHaveBeenCalledWith("/invitations/tok");
    expect(preview.clinic.name).toBe("Clínica X");

    const accepted = await invitations.accept("tok");
    expect(postMock).toHaveBeenCalledWith("/invitations/tok/accept");
    expect(accepted.membership.id).toBe("m1");
  });
});
