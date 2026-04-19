import { auth } from "../src/lib/auth.ts";
import { prisma } from "../src/lib/prisma.ts";
import { Role } from "../generated/prisma/enums.ts";

async function seedUser(
  ctx: Awaited<typeof auth.$context>,
  email: string,
  password: string,
  name: string,
  role: Role,
): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== role) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role },
      });
      console.log(`Updated ${email} to role "${role}"`);
    } else {
      console.log(`User ${email} (${role}) already exists`);
    }
    return;
  }

  const hashedPassword = await ctx.password.hash(password);
  const now = new Date();

  const user = await ctx.adapter.create<{ id: string }>({
    model: "user",
    data: {
      email,
      name,
      emailVerified: true,
      role,
      createdAt: now,
      updatedAt: now,
    },
  });

  await ctx.adapter.create({
    model: "account",
    data: {
      providerId: "credential",
      accountId: user.id,
      userId: user.id,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    },
  });

  console.log(`Seeded ${role} user: ${email}`);
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set (see .env.example)",
    );
  }

  const ctx = await auth.$context;

  // Always seed the admin user.
  await seedUser(ctx, adminEmail, adminPassword, "Admin", Role.admin);

  // Seed the agent user only when the env vars are provided (e2e test runs).
  const agentEmail = process.env.SEED_AGENT_EMAIL;
  const agentPassword = process.env.SEED_AGENT_PASSWORD;
  if (agentEmail && agentPassword) {
    await seedUser(ctx, agentEmail, agentPassword, "Agent", Role.agent);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
