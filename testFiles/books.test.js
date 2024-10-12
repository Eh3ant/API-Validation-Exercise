
process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");


let book1;

beforeEach(async () => {
    // Add a book for testing
    const result = await db.query(
        `INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
     VALUES ('1234567890', 'http://amazon.com/book1', 'Author1', 'english', 200, 'Publisher1', 'Test Book 1', 2020)
     RETURNING isbn, amazon_url, author, language, pages, publisher, title, year`
    );
    book1 = result.rows[0];
});

afterEach(async () => {
    await db.query("DELETE FROM books");
});

afterAll(async () => {
    await db.end();
});

describe("GET /books", () => {
    test("Should return a list of all books", async () => {
        const response = await request(app).get("/books");
        expect(response.statusCode).toBe(200);
        expect(response.body.books.length).toBe(1);
        expect(response.body.books[0].title).toBe(book1.title);
    });
});

describe("POST /books", () => {
    test("Should create a new book", async () => {
        const newBook = {
            isbn: "0987654321",
            amazon_url: "http://amazon.com/book2",
            author: "Author2",
            language: "english",
            pages: 300,
            publisher: "Publisher2",
            title: "Test Book 2",
            year: 2021
        };
        const response = await request(app).post("/books").send(newBook);
        expect(response.statusCode).toBe(201);
        expect(response.body.book.title).toBe(newBook.title);
    });

    test("Should return validation error for invalid input", async () => {
        const invalidBook = {
            isbn: "0987654321",
            amazon_url: "not-a-url",
            author: "Author2",
            language: "english",
            pages: 300,
            publisher: "Publisher2",
            title: "Test Book 2",
            year: 2021
        };
        const response = await request(app).post("/books").send(invalidBook);
        expect(response.statusCode).toBe(400);
        expect(response.body.error.message.length).toBeGreaterThan(0);
    });
});

describe("PUT /books/:isbn", () => {
    test("Should update a book", async () => {
        const updatedBook = {
            amazon_url: "http://amazon.com/book1-updated",
            author: "Author1 Updated",
            language: "english",
            pages: 250,
            publisher: "Publisher1 Updated",
            title: "Test Book 1 Updated",
            year: 2021
        };
        const response = await request(app).put(`/books/${book1.isbn}`).send(updatedBook);
        expect(response.statusCode).toBe(200);
        expect(response.body.book.title).toBe(updatedBook.title);
    });

    test("Should return validation error for invalid input", async () => {
        const invalidUpdate = {
            amazon_url: "invalid-url",
            author: "Author1 Updated",
            language: "english",
            pages: 250,
            publisher: "Publisher1 Updated",
            title: "Test Book 1 Updated",
            year: 2021
        };
        const response = await request(app).put(`/books/${book1.isbn}`).send(invalidUpdate);
        expect(response.statusCode).toBe(400);
    });
});
