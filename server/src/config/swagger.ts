import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'BharatFlows API',
            version: '1.0.0',
            description: 'API Documentation for BharatFlows MSME Operating System',
            contact: {
                name: 'BharatFlows Support',
                email: 'admin@bharatflows.com',
            },
        },
        servers: [
            {
                url: 'https://api.bharatflows.com/api/v1',
                description: 'Production Server',
            },
            {
                url: 'http://localhost:5001/api/v1',
                description: 'Local Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/controllers/**/*.ts', './src/docs/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
