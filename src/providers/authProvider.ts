import type { AuthProvider } from "ra-core";
import { authClient } from "@/lib/auth-client";

const isEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      // Si parece email, usamos signIn.email, si no, signIn.username
      const { data, error } = isEmail(email)
        ? await authClient.signIn.email({ email, password })
        : await authClient.signIn.username({ username: email, password });

      if (error) {
        throw new Error(error.message || "Invalid credentials");
      }

      return data;
    } catch (err: any) {
      console.error("Login Provider Error:", err);
      throw new Error(err.message || "Invalid credentials");
    }
  },
  logout: async () => {
    await authClient.signOut();
  },
  checkError: async (error) => {
    const status = error.status;
    if (status === 401 || status === 403) {
      return Promise.reject();
    }
    return Promise.resolve();
  },
  checkAuth: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      throw new Error("Authentication required");
    }
  },
  getPermissions: async () => {
    return Promise.resolve();
  },
  getIdentity: async () => {
    const { data: session } = await authClient.getSession();
    if (session) {
      return {
        id: session.user.id,
        fullName: session.user.name,
        avatar: session.user.image ?? undefined,
      };
    }
    throw new Error("No identity found");
  },
};
