import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminHash = await bcrypt.hash('admin@123', 12);
  const citizenHash = await bcrypt.hash('citizen@123', 12);
  const agentHash = await bcrypt.hash('agent@123', 12);

  // Create admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gaap.gov.in' },
    update: {},
    create: {
      email: 'admin@gaap.gov.in',
      phone: '9000000001',
      name: 'GAAP Administrator',
      passwordHash: adminHash,
      role: 'ADMIN',
      isVerified: true,
    },
  });

  // Create agent
  const agent = await prisma.user.upsert({
    where: { email: 'agent@gaap.gov.in' },
    update: {},
    create: {
      email: 'agent@gaap.gov.in',
      phone: '9000000002',
      name: 'Priya Sharma (Agent)',
      passwordHash: agentHash,
      role: 'AGENT',
      isVerified: true,
    },
  });

  // Create citizen
  const citizen = await prisma.user.upsert({
    where: { email: 'citizen@example.com' },
    update: {},
    create: {
      email: 'citizen@example.com',
      phone: '9000000003',
      name: 'Rajesh Kumar Singh',
      passwordHash: citizenHash,
      role: 'CITIZEN',
      isVerified: true,
    },
  });

  console.log('✅ Seed complete!');
  console.log('\n📋 Demo Accounts:');
  console.log('  Admin:   admin@gaap.gov.in    / admin@123');
  console.log('  Agent:   agent@gaap.gov.in    / agent@123');
  console.log('  Citizen: citizen@example.com  / citizen@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
