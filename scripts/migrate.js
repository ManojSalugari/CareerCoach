const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Starting database migration...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Push schema to database
    const { execSync } = require('child_process');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    console.log('✅ Database schema pushed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
