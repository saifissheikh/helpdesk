import { auth } from "../src/lib/auth.ts";
import { prisma } from "../src/lib/prisma.ts";
import { Role } from "../generated/prisma/enums.ts";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set (see .env.example)",
    );
  }

  const ctx = await auth.$context;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== Role.admin) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: Role.admin },
      });
      console.log(`Promoted existing user ${email} to admin`);
    } else {
      console.log(`Admin user ${email} already exists`);
    }
    return;
  }

  const hashedPassword = await ctx.password.hash(password);
  const now = new Date();

  const user = await ctx.adapter.create<{ id: string }>({
    model: "user",
    data: {
      email,
      name: "Admin",
      emailVerified: true,
      role: Role.admin,
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

  console.log(`Seeded admin user ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
