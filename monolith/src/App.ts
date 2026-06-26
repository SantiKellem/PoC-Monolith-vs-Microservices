import express from "express";
import type { Request, Response } from "express";
import { TransferController } from './TransferController.js';

const app = express();

app.use(express.json());

app.post('/api/transfer', async (req: Request, res: Response) => TransferController.handleRequest(req, res));

app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;