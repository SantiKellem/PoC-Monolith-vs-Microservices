import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AccountModel {
    static async debitAccount(accountId: number, amount: number) {
        try {
            const account = await prisma.account.findUnique({ where: { id: accountId } });
            
            if (!account) 
                throw new Error('Account not found');

            if (account.balance < amount) 
                throw new Error('Insufficient funds');
            
            const updated = await prisma.account.update({
                where: { id: accountId },
                data: { balance: { decrement: amount } }
            });

            return updated;
        }
        catch (error) {
            throw error;
        }
    }

    static async creditAccount(accountId: number, amount: number) {
        try {
            const updatedAccount = await prisma.account.update({
                where: { id: accountId },
                data: { balance: { increment: amount } }
            });

            return updatedAccount;
        } 
        catch (error) {
            throw error;
        }
    }   
}