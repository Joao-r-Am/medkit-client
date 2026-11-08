import { describe, expect, it, vi, beforeEach } from "vitest";

const notifyMock = vi.fn();

vi.mock("quasar", () => ({ Notify: { create: notifyMock } }));

const { notifyClinicContextRequired } =
  await import("@/router/clinic-context-notify");

describe("router/clinic-context-notify", () => {
  beforeEach(() => {
    notifyMock.mockClear();
  });

  it("emite alerta para selecionar/criar clínica", () => {
    notifyClinicContextRequired();

    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "warning",
        message: expect.stringContaining("clínica")
      })
    );
  });
});
