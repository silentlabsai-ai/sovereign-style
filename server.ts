import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateOutfitController } from './src/api/routes/generate-outfit';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('./'));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Sovereign Style API is running' });
});

// API Routes
app.post('/api/v1/generate-outfit', generateOutfitController);

// Export for Vercel
export default app;

// Start Server locally
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`
    🚀 Sovereign Style Backend Logic Online
    🌍 Port: ${PORT}
    🛠️  Routes: POST /api/v1/generate-outfit
    `);
  });
}
