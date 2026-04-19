import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.ts";
import { Role } from "../../generated/prisma/enums.ts";

const trustedOrigins = (process.env.TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (trustedOrigins.length === 0) {
  throw new Error("TRUSTED_ORIGINS must be set (comma-separated list of allowed origins)");
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    revokeSessionsOnPasswordReset: true,
  },
  rateLimit: { enabled: process.env.NODE_ENV !== "test" },
  trustedOrigins,
  user: {
    additionalFields: {
      role: {
        type: Object.values(Role) as [string, ...string[]],
        required: false,
        defaultValue: Role.agent,
        input: false,
      },
    },
  },
});
