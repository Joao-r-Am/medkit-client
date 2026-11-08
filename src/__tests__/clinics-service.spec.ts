import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();

vi.mock("@/services/http", () => ({
  default: { get: getMock }
}));

async function loadService() {
  const { default: clinics } = await import("@/services/clinics");
  return clinics;
}

describe("services/clinics", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("myClinics busca /me/clinics e retorna a lista", async () => {
    const payload = [
      { membership_id: "m1", status: "active", clinic: null, roles: [] }
    ];
    getMock.mockResolvedValue({ data: { data: payload } });

    const clinics = await loadService();
    const result = await clinics.myClinics();

    expect(getMock).toHaveBeenCalledWith("/me/clinics");
    expect(result).toEqual(payload);
  });

  it("getClinic busca o detalhe da clínica informada", async () => {
    getMock.mockResolvedValue({ data: { id: "c1", name: "Clínica X" } });

    const clinics = await loadService();
    const result = await clinics.getClinic("c1");

    expect(getMock).toHaveBeenCalledWith("/clinics/c1");
    expect(result.name).toBe("Clínica X");
  });

  it("members, roles e permissions leem o data da resposta", async () => {
    getMock.mockResolvedValueOnce({
      data: { data: [{ membership_id: "m1" }] }
    });
    getMock.mockResolvedValueOnce({
      data: { data: [{ id: "r1", name: "owner" }] }
    });
    getMock.mockResolvedValueOnce({
      data: { data: [{ code: "clinic.read" }] }
    });

    const clinics = await loadService();

    expect(await clinics.members("c1")).toEqual([{ membership_id: "m1" }]);
    expect(await clinics.roles("c1")).toEqual([{ id: "r1", name: "owner" }]);
    expect(await clinics.permissions()).toEqual([{ code: "clinic.read" }]);
    expect(getMock).toHaveBeenNthCalledWith(2, "/clinics/c1/roles");
    expect(getMock).toHaveBeenNthCalledWith(3, "/permissions");
  });

  it("propaga erro da requisição", async () => {
    getMock.mockRejectedValue(new Error("403"));

    const clinics = await loadService();

    await expect(clinics.myClinics()).rejects.toThrow("403");
  });

  it("lookupCnpj consulta a rota de conta com só os dígitos do CNPJ", async () => {
    const lookup = {
      cnpjf: "12345678000195",
      name: "Clínica Receita",
      email: "contato@clinica.com.br",
      phone: "51999999999",
      address: {
        street: "Rua das Clínicas",
        city: "Porto Alegre",
        state: "RS",
        country: "Brasil"
      }
    };
    getMock.mockResolvedValue({ data: lookup });

    const clinics = await loadService();
    const result = await clinics.lookupCnpj("12.345.678/0001-95");

    expect(getMock).toHaveBeenCalledWith("/clinics/cnpj/12345678000195");
    expect(result.name).toBe("Clínica Receita");
    expect(result.address!.street).toBe("Rua das Clínicas");
  });
});
