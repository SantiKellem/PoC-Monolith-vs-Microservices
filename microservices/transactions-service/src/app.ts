import express from 'express';
import type { Request, Response } from 'express';
import { TransactionController } from './TransactionController.js';

const app = express();

app.use(express.json());

// Only one endpoint for the transaction service, which then calls the account's endpoints to debit and credit funds
app.post('/api/transfer', TransactionController.handleTransaction);

app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Transactions Service running on port ${PORT}`);
});