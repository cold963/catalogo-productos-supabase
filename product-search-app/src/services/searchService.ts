import { Product } from '../types';
import { products } from '../models/product';

export class SearchService {
    findProducts(searchText: string): Product[] {
        const lowerCaseSearchText = searchText.toLowerCase();
        return products.filter(product => 
            product.name.toLowerCase().includes(lowerCaseSearchText) ||
            product.description.toLowerCase().includes(lowerCaseSearchText)
        );
    }
}