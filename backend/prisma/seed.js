// prisma/seed.js
// Run with: npm run prisma:seed
// Creates a default admin login and 3 sample services.

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', passwordHash },
  });

  const serviceNames = ['General Consultation', 'Haircut', 'Turf Slot - 1 Hour'];
  for (const name of serviceNames) {
    const existing = await prisma.service.findFirst({ where: { name } });
    if (!existing) {
      await prisma.service.create({ data: { name } });
    }
  }

  console.log('Seed complete.');
  console.log('Admin login -> username: admin | password: admin123');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
