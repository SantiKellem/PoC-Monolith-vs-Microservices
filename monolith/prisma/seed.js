import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	console.log('Populating database with test data');

	await prisma.transaction.deleteMany();
	await prisma.account.deleteMany();
	console.log('DB cleaned');

	const accountsData = Array.from({ length: 10 }).map((_, index) => ({
		id: index + 1,
		owner: `Client ${index + 1}`,
		balance: 10000000.00,
	}));

	const createdAccounts = await prisma.account.createMany({
		data: accountsData,
	});

	console.log(`${createdAccounts.count} test accounts created successfully.`);
}

main()
	.catch((e) => {
		console.error('Error during seeding:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
