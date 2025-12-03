import express from 'express';
import { json } from 'body-parser';
import { setSearchRoutes } from './routes/searchRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(json());
setSearchRoutes(app);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});