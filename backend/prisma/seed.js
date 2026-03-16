const { PrismaClient } = require("@prisma/client");
const { hashPassword } = require("../src/services/password.service");

const prisma = new PrismaClient();

async function main() {
  const password = await hashPassword("user1234");

  await prisma.user.upsert({
    where: { email: "user@gmail.com" },
    update: {},
    create: {
      email: "user@gmail.com",
      password,
      firstName: "Usuario",
      lastName: "Admin",
      role: "ADMIN",
    },
  });

  console.log("Seed completado: usuario por defecto creado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
