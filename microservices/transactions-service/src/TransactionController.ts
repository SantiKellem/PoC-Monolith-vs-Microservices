import type { Request, Response } from "express";
import { TransactionModel } from './TransactionModel.js';

// Account Service URL for inter-service communication
const ACCOUNTS_SERVICE_URL = process.env.ACCOUNTS_SERVICE_URL || 'http://localhost:3001';

interface TransactionPayload {
    originId: number;
    destinationId: number;
    amount: number;
}

export class TransactionController {
    static async handleTransaction(req: Request, res: Response) {
        try {
            const { originId, destinationId, amount } = req.body as TransactionPayload;

            if (!originId || !destinationId || amount <= 0) 
                return res.status(400).json({ error: 'Invalid transfer data' });

            if (originId === destinationId) 
                throw new Error('Origin and destination accounts cannot be the same');

            // HTTP inter-service call to debit from the origin account
            const debitReq = await fetch(`${ACCOUNTS_SERVICE_URL}/api/accounts/debit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId: originId, amount: amount })
            });

            if (!debitReq.ok) {
                const errorResponse = await debitReq.json();
                throw new Error(`${errorResponse.error}`);
            }

            // HTTP inter-service call to credit the destination account
            const creditReq = await fetch(`${ACCOUNTS_SERVICE_URL}/api/accounts/credit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId: destinationId, amount: amount })
            });

            if (!creditReq.ok) {
                const errorResponse = await creditReq.json();
                throw new Error(`${errorResponse.error}`);
            }

            // Register transaction in DB after both debit and credit operations succeed
            const transaction = await TransactionModel.createTransaction(originId, destinationId, amount);

            return res.status(201).json(transaction);

        } catch (error: any) {
            console.dir(error, { depth: null });

            return res.status(400).json({
                error: error.message,
                cause: error.cause
            });
        }
    }
}