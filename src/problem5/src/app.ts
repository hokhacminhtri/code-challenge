import { json } from 'body-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import openApiSpec from './docs/openapi';
import { errorHandler, notFoundHandler } from './middleware/errorHandlers';
import { booksRouter } from './routes/books';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// OpenAPI docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.get('/openapi.json', (_req, res) => res.json(openApiSpec));

app.use('/books', booksRouter);

app.use(notFoundHandler);
app.use(errorHandler);
