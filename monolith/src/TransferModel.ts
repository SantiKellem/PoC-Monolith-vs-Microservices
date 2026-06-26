import { PrismaClient } from '@prisma/client';
import type { Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export class TransferModel {
    static async processTransfer(originId: number, destinationId: number, amount: number) {
        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const originAccount = await tx.account.findUnique({
                where: { id: originId },
            });

            if (!originAccount) 
                throw new Error('Origin account not found');

            if (originAccount.balance < amount) 
                throw new Error('Insufficient funds');

            if (originAccount.id === destinationId) 
                throw new Error('Origin and destination accounts cannot be the same');

            await tx.account.update({
                where: { id: originId },
                data: { balance: { decrement: amount } },
            });

            await tx.account.update({
                where: { id: destinationId },
                data: { balance: { increment: amount } },
            });

            const transfer = await tx.transaction.create({
                data: {
                    amount,
                    originId,
                    destinationId,
                },
            });

            return transfer;
        });
    }
}