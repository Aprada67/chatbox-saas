import 'dotenv/config';
import app from './src/app.js';
import { startCronJobs } from './src/services/cronService.js'

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
    startCronJobs()
})