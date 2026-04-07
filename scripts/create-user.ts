import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [username, password, name, role] = process.argv.slice(2);

  if (!username || !password || !name) {
    console.error("Usage: tsx scripts/create-user.ts <username> <password> <name> [role]");
    process.exit(1);
  }

  const hashed = bcrypt.hashSync(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      password: hashed,
      name,
      role: (role as "USER" | "ADMIN") || "USER",
    },
  });

  console.log("Created user:", { id: user.id, username: user.username, name: user.name, role: user.role });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
