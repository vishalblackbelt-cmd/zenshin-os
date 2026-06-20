import 'dotenv/config';
import app from './app.js';
import { startCronScheduler } from './services/cron.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`[Server] Zenshin OS API running at http://localhost:${PORT}`);
  
  // Start Cron checker
  startCronScheduler();
});
