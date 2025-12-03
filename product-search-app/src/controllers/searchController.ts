import { Request, Response } from 'express';
import { SearchService } from '../services/searchService';

export class SearchController {
    private searchService: SearchService;

    constructor() {
        this.searchService = new SearchService();
    }

    public searchProducts = (req: Request, res: Response): void => {
        const query = req.query.q as string;
        const results = this.searchService.findProducts(query);
        res.json(results);
    }
}