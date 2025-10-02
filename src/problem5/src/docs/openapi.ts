import { OpenAPIV3 } from 'openapi-types';

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'Books Service API',
    version: '1.0.0',
    description: 'CRUD API for managing books.'
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local dev' }
  ],
  tags: [
    { name: 'Books', description: 'Operations about books' }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Service healthy',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { status: { type: 'string' } } }
              }
            }
          }
        }
      }
    },
    '/books': {
      get: {
        tags: ['Books'],
        summary: 'List books',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
          { name: 'title', in: 'query', schema: { type: 'string' } },
            { name: 'author', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Paginated list of books',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Book' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    pageSize: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Books'],
        summary: 'Create a book',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateBook' }
            }
          }
        },
        responses: {
          '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Book' } } } },
          '400': { description: 'Validation error' }
        }
      }
    },
    '/books/{id}': {
      get: {
        tags: ['Books'],
        summary: 'Get book by id',
        parameters: [ { $ref: '#/components/parameters/BookId' } ],
        responses: {
          '200': { description: 'Book', content: { 'application/json': { schema: { $ref: '#/components/schemas/Book' } } } },
          '404': { description: 'Not found' }
        }
      },
      put: {
        tags: ['Books'],
        summary: 'Update book',
        parameters: [ { $ref: '#/components/parameters/BookId' } ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateBook' } } }
        },
        responses: {
          '200': { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Book' } } } },
          '400': { description: 'Validation error' },
          '404': { description: 'Not found' }
        }
      },
      delete: {
        tags: ['Books'],
        summary: 'Delete book',
        parameters: [ { $ref: '#/components/parameters/BookId' } ],
        responses: {
          '204': { description: 'Deleted' },
          '404': { description: 'Not found' }
        }
      }
    }
  },
  components: {
    parameters: {
      BookId: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Book ID'
      }
    },
    schemas: {
      Book: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          author: { type: 'string' },
          description: { type: 'string', nullable: true },
          publishedAt: { type: 'string', format: 'date-time', nullable: true },
          pages: { type: 'integer', nullable: true },
          isbn: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['id','title','author','createdAt','updatedAt']
      },
      CreateBook: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          author: { type: 'string' },
          description: { type: 'string' },
          publishedAt: { type: 'string', format: 'date-time' },
          pages: { type: 'integer' },
          isbn: { type: 'string' }
        },
        required: ['title','author']
      },
      UpdateBook: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          author: { type: 'string' },
          description: { type: 'string' },
          publishedAt: { type: 'string', format: 'date-time' },
          pages: { type: 'integer' },
          isbn: { type: 'string' }
        }
      }
    }
  }
};

export default openApiSpec;
