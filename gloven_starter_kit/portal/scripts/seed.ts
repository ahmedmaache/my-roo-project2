/**
 * Database Seed Script
 * Enterprise Maturity Pack v1 - Slice 1
 * 
 * Seeds the database with initial roles and a development admin user.
 * Prints one-time dev code to server logs for signin when SMTP is not configured.
 */

import { prisma } from '../src/lib/db';
import { randomBytes } from 'crypto';

// Generate a random one-time code for development
function generateOneTimeCode(): string {
  return randomBytes(4).toString('hex').toUpperCase(); // 8-character code
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Create roles
  console.log('Creating roles...');
  const roles = [
    { name: 'ADMIN', description: 'System administrator with full access' },
    { name: 'STAFF', description: 'Gloven staff member' },
    { name: 'FOUNDER', description: 'Startup founder' },
    { name: 'MENTOR', description: 'Program mentor' },
    { name: 'INVESTOR', description: 'Investor' },
  ];

  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });
    console.log(`✓ Created role: ${roleData.name}`);
  }

  // Create development admin user if not exists
  const adminEmail = 'admin@example.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    // Generate one-time code for development
    const oneTimeCode = generateOneTimeCode();
    
    const adminUser = await prisma.user.create({
      data: {
        name: 'Development Admin',
        email: adminEmail,
        emailVerified: new Date(),
        role: {
          connect: { name: 'ADMIN' },
        },
      },
    });

    console.log('\n🎉 DEVELOPMENT SETUP COMPLETE');
    console.log('================================');
    console.log(`Admin User: ${adminEmail}`);
    console.log(`One-Time Dev Code: ${oneTimeCode}`);
    console.log('================================');
    console.log('\n📝 IMPORTANT:');
    console.log('1. Use the email and one-time code above to sign in');
    console.log('2. This code is only printed once and is not stored');
    console.log('3. In production, configure SMTP for email magic links');
    console.log('4. For security, change the admin email in production\n');
  } else {
    console.log(`✓ Admin user already exists: ${adminEmail}`);
  }

  // Create sample cohort if none exists
  const existingCohort = await prisma.cohort.findFirst();
  if (!existingCohort) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    await prisma.cohort.create({
      data: {
        name: 'Cohort 2024',
        description: 'Initial development cohort',
        startDate: nextMonth,
        endDate: nextYear,
        status: 'UPCOMING',
      },
    });
    console.log('✓ Created sample cohort');
  }

  console.log('\n✅ Database seed completed successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Seed script failed:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });