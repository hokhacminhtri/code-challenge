import { Router } from 'express';
import { createBookHandler, deleteBookHandler, getBookHandler, listBooksHandler, updateBookHandler } from '../controllers/booksController';

export const booksRouter = Router();

booksRouter.post('/', createBookHandler);
booksRouter.get('/', listBooksHandler);
booksRouter.get('/:id', getBookHandler);
booksRouter.put('/:id', updateBookHandler);
booksRouter.delete('/:id', deleteBookHandler);
