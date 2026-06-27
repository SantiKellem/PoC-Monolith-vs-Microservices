import express from 'express';
import type { Request, Response } from 'express';
import { AccountController } from './AccountController.js';

const app = express();

app.use(express.json());

// Expose endpoint for debit operation
app.post('/api/accounts/debit', AccountController.handleDebit);

// Expose endpoint for credit operation
app.post('/api/accounts/credit', AccountController.handleCredit);

const PORT = process.env.PORT || 3001;

app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(Number(PORT), '::', () => {
    console.log(`Accounts Service running on port ${PORT}`);
});