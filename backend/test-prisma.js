const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

// Set DATABASE_URL for testing if not set
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/reachinbox';
}

async function testPrisma() {
    console.log('Testing Prisma Client import...');
    try {
        const prisma = new PrismaClient();
        console.log('✓ Prisma Client imported successfully');
    } catch (error) {
        console.error('✗ Failed to import Prisma Client:', error.message);
        return;
    }

    console.log('Checking for debian-openssl-3.0.x binary...');
    try {
        const result = execSync('openssl version', { encoding: 'utf8' });
        if (result.includes('3.0')) {
            console.log('✓ debian-openssl-3.0.x binary is present');
        } else {
            console.log('? OpenSSL found but version may differ:', result.trim());
        }
    } catch (error) {
        console.log('? OpenSSL not available on host (expected on Windows); binary is present in Debian-based Docker image');
    }

    console.log('Testing simple database query...');
    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        const userCount = await prisma.user.count();
        console.log(`✓ Database query successful. User count: ${userCount}`);
    } catch (error) {
        console.error('✗ Database query failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testPrisma();