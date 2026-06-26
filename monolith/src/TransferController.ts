import type { Request, Response } from "express";
import { TransferModel } from './TransferModel.js';

interface TransferPayload {
    originId: number;
    destinationId: number;
    amount: number;
}

export class TransferController {
    static async handleRequest(req: Request, res: Response) {
        try {
            const { originId, destinationId, amount } = req.body as TransferPayload;

            if (!originId || !destinationId || amount <= 0) 
                return res.status(400).json({ error: 'Invalid transfer data' });

            const transaction = await TransferModel.processTransfer(originId, destinationId, amount);

            return res.status(201).json(transaction);
        } 
        catch (error: any) {
            return res.status(400).json({ error: error.message || 'An error occurred during the transfer' });
        }
    }
}