"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const count = await prisma.book.count();
    if (count > 0) {
        // eslint-disable-next-line no-console
        console.log('Seed skipped: books already exist');
        return;
    }
    await prisma.book.createMany({
        data: [
            {
                title: 'Clean Code',
                author: 'Robert C. Martin',
                description: 'A Handbook of Agile Software Craftsmanship',
                pages: 464,
                isbn: '9780132350884',
                publishedAt: new Date('2008-08-01')
            },
            {
                title: 'The Pragmatic Programmer',
                author: 'Andrew Hunt / David Thomas',
                description: 'Your Journey to Mastery',
                pages: 352,
                isbn: '9780135957059',
                publishedAt: new Date('1999-10-30')
            }
        ]
    });
    // eslint-disable-next-line no-console
    console.log('Seed data inserted');
}
main().catch(e => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
