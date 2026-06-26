import type { Request, Response } from "express";
import { AccountModel } from './AccountModel.js';

interface AccountActionPayload {
    accountId: number;
    amount: number;
}

export class AccountController {
    static async handleDebit(req: Request, res: Response) {
        const { accountId, amount } = req.body as AccountActionPayload;

        if (!accountId || !amount || amount <= 0) 
            return res.status(400).json({ error: 'Invalid accountId or amount' });
            
        try {
            const updated = await AccountModel.debitAccount(accountId, amount);
            return res.status(200).json(updated);
        } 
        catch (error: any) {
            return res.status(500).json({ error: `Error processing debit: ${error.message}` });
        }
    }
    
    static async handleCredit(req: Request, res: Response) {
        const { accountId, amount } = req.body as AccountActionPayload;

        if (!accountId || !amount || amount <= 0) 
            return res.status(400).json({ error: 'Invalid accountId or amount' });
    
        try {
            const updated = await AccountModel.creditAccount(accountId, amount);
            return res.status(200).json(updated);
        } 
        catch (error: any) {
            return res.status(500).json({ error: `Error processing credit: ${error.message}` });
        }
    }
}