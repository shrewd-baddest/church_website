import { app } from '../src/app.js';
import { connectDb } from '../src/Configs/dbConfig.js';
import request from 'supertest'; // assuming supertest is installed, or I'll use express direct

async function test() {
  await connectDb();
  console.log("Testing /api/gallery...");
  app.get('/api/gallery', async (req, res, next) => {
      // Re-triggering the same logic if it's already defined
  });
  
  // Since supertest might not be there, I'll mock a request object
  // Actually, let's just use the controller directly
  import { getTableData } from '../src/controllers/ApiController.js';
  try {
     const data = await getTableData('gallery');
     console.log("Data length:", data.length);
  } catch (e) {
     console.error("FAILED with error:", e);
  }
  process.exit(0);
}

test();
