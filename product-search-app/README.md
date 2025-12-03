# Product Search App

This project is a simple product search application built with TypeScript and Express. It allows users to search for products based on their text descriptions.

## Features

- Search for products by name or description.
- Returns a list of products that match the search criteria.
- Built using TypeScript for type safety and better development experience.

## Project Structure

```
product-search-app
├── src
│   ├── app.ts                  # Entry point of the application
│   ├── controllers
│   │   └── searchController.ts  # Handles product search requests
│   ├── routes
│   │   └── searchRoutes.ts      # Defines routes for product searching
│   ├── models
│   │   └── product.ts           # Defines the structure of a product object
│   ├── services
│   │   └── searchService.ts      # Contains search logic for products
│   └── types
│       └── index.ts             # Defines types used throughout the application
├── package.json                 # npm configuration file
├── tsconfig.json                # TypeScript configuration file
└── README.md                    # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd product-search-app
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

To start the application, run the following command:
```
npm start
```

The application will be available at `http://localhost:3000`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.