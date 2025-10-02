import { NextFunction, Request, Response } from 'express';
import { bookService } from '../services/bookService';
import { createBookSchema, listBooksQuerySchema, normalizeBookInput, updateBookSchema } from '../validators/bookSchemas';

export const createBookHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
  const parsed = createBookSchema.parse(req.body);
  const normalized = normalizeBookInput(parsed);
  const book = await bookService.create(normalized);
    res.status(201).json(book);
  } catch (err) {
    next(err);
  }
};

export const listBooksHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = listBooksQuerySchema.parse(req.query);
    const result = await bookService.list(parsed);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getBookHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const book = await bookService.getById(id);
    if (!book) {
      res.status(404).json({ message: 'Book not found' });
      return;
    }
    res.json(book);
  } catch (err) {
    next(err);
  }
};

export const updateBookHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
  const parsed = updateBookSchema.parse(req.body);
  const normalized = normalizeBookInput(parsed);
  const updated = await bookService.update(id, normalized);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const deleteBookHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await bookService.delete(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
