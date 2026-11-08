import { describe, expect, it } from "vitest";
import { resolveNavigationGuard } from "@/router/guards";

describe("guards/resolveNavigationGuard", () => {
  it("sem token em rota protegida vai para /auth", () => {
    expect(
      resolveNavigationGuard({
        path: "/patients",
        hasToken: false,
        hasClinicContext: true
      })
    ).toBe("/auth");
    expect(
      resolveNavigationGuard({
        path: "/appointments",
        hasToken: false,
        hasClinicContext: false
      })
    ).toBe("/auth");
  });

  it("login/auth com token redireciona para /", () => {
    expect(
      resolveNavigationGuard({
        path: "/auth",
        hasToken: true,
        hasClinicContext: false
      })
    ).toBe("/");
    expect(
      resolveNavigationGuard({
        path: "/login",
        hasToken: true,
        hasClinicContext: true
      })
    ).toBe("/");
  });

  it("autoagendamento por link é público mesmo com token ou sem clínica", () => {
    expect(
      resolveNavigationGuard({
        path: "/to-schedule/abc",
        hasToken: false,
        hasClinicContext: false
      })
    ).toBeUndefined();
    expect(
      resolveNavigationGuard({
        path: "/to-schedule/abc",
        hasToken: true,
        hasClinicContext: false
      })
    ).toBeUndefined();
  });

  it("rota tenant sem contexto de clínica é barrada para /profile", () => {
    expect(
      resolveNavigationGuard({
        path: "/patients",
        hasToken: true,
        hasClinicContext: false
      })
    ).toBe("/profile");
    expect(
      resolveNavigationGuard({
        path: "/registrations/professionals",
        hasToken: true,
        hasClinicContext: false
      })
    ).toBe("/profile");
  });

  it("rotas de conta (/profile, /clinics) ficam liberadas sem vínculo", () => {
    expect(
      resolveNavigationGuard({
        path: "/profile",
        hasToken: true,
        hasClinicContext: false
      })
    ).toBeUndefined();
    expect(
      resolveNavigationGuard({
        path: "/clinics",
        hasToken: true,
        hasClinicContext: false
      })
    ).toBeUndefined();
  });

  it("com contexto de clínica todas as rotas autenticadas são permitidas", () => {
    expect(
      resolveNavigationGuard({
        path: "/patients",
        hasToken: true,
        hasClinicContext: true
      })
    ).toBeUndefined();
    expect(
      resolveNavigationGuard({
        path: "/",
        hasToken: true,
        hasClinicContext: true
      })
    ).toBeUndefined();
  });
});
