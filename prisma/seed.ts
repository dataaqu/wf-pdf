import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admins
  const admins = [
    { username: "temo", name: "Temo", password: "Weforwardtemo!" },
    { username: "kakha", name: "Kakha", password: "Weforwardkakha!" },
  ];

  // Regular users
  const users = [
    { username: "giorgi", name: "Giorgi", password: "Weforwardgiorgi!" },
    { username: "ani", name: "Ani", password: "Weforwardani!" },
    { username: "juju", name: "Juju", password: "Weforwardjuju!" },
    { username: "makuna", name: "Makuna", password: "Weforwardmakuna!" },
    { username: "lika", name: "Lika", password: "Weforwardlika!" },
    { username: "keti", name: "Keti", password: "Weforwardketi!" },
  ];

  for (const admin of admins) {
    const hashed = await bcrypt.hash(admin.password, 12);
    await prisma.user.upsert({
      where: { username: admin.username },
      update: {},
      create: { username: admin.username, password: hashed, name: admin.name, role: "ADMIN" },
    });
    console.log("Admin:", admin.username);
  }

  for (const user of users) {
    const hashed = await bcrypt.hash(user.password, 12);
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: { username: user.username, password: hashed, name: user.name, role: "USER" },
    });
    console.log("User:", user.username);
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
