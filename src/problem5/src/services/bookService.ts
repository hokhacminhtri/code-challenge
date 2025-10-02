import { Book, PrismaClient } from '@prisma/client';
import { ListBooksQuery } from '../validators/bookSchemas';

const prisma = new PrismaClient();

export interface CreateBookInput {
  title: string;
  author: string;
  description?: string | null;
  publishedAt?: Date | null;
  pages?: number | null;
  isbn?: string | null;
}

export interface UpdateBookInput {
  title?: string;
  author?: string;
  description?: string | null;
  publishedAt?: Date | null;
  pages?: number | null;
  isbn?: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

class BookService {
  async create(input: CreateBookInput): Promise<Book> {
    return prisma.book.create({ data: input });
  }

  async list(query: ListBooksQuery): Promise<PaginatedResult<Book>> {
    const { page = 1, pageSize = 20, title, author } = query;
    const skip = (page - 1) * pageSize;
    const where: any = {};
    if (title) where.title = { contains: title, mode: 'insensitive' };
    if (author) where.author = { contains: author, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      prisma.book.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      prisma.book.count({ where })
    ]);
    return { data, total, page, pageSize };
  }

  async getById(id: string): Promise<Book | null> {
    return prisma.book.findUnique({ where: { id } });
  }

  async update(id: string, input: UpdateBookInput): Promise<Book> {
    return prisma.book.update({ where: { id }, data: input });
  }

  async delete(id: string): Promise<void> {
    await prisma.book.delete({ where: { id } });
  }
}

export const bookService = new BookService();
