import { Router } from 'express';
import { SearchController } from '../controllers/searchController';

const router = Router();
const searchController = new SearchController();

export function setSearchRoutes(app: Router) {
    app.use('/search', router);
    router.get('/', searchController.searchProducts.bind(searchController));
}