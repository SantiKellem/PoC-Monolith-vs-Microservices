import express from 'express'
import cors from "cors"
import dotenv from 'dotenv';
// import { ProcessController } from './ProcessController.js';

const PORT = Number(process.env.PORT) || 3000;

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());   

// app.use('/api/process', (req, res) => ProcessController.handleRequest(req, res));

app.use((req, res, next) => {
    res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => { 
    console.log(`Server running on port ${PORT}`);
});

export default app