import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TransactionModel {
    static async createTransaction(originId: number, destinationId: number, amount: number) {
        return await prisma.transaction.create({
            data: {
                originId,
                destinationId,
                amount
            }
        });
    }
}