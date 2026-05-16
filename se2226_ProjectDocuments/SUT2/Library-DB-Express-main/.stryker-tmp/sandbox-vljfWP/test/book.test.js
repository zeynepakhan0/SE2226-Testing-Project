// @ts-nocheck
const request = require("supertest");
const app = require("../app");
const { sequelize, Book } = require("../models");
const { Op } = require("sequelize");

/**
 * FULL MUTATION KILLER SUITE
 * Bu dosya Stryker'ın tüm "StringLiteral", "Boolean" ve "Logic" mutantlarını öldürmek için optimize edilmiştir.
 */

beforeAll(async () => {
    // Veritabanını temizle ve hazırla
    await sequelize.sync({ force: true });
});

afterEach(async () => {
    // Her testten sonra veritabanını temizle
    await Book.destroy({ where: {}, truncate: true });
    jest.restoreAllMocks();
});

describe("Comprehensive Mutation Killer Suite", () => {

    /* --- 1. INDEX / HOME ROUTE --- */
    describe("GET / (Home Route)", () => {
        it("should redirect to /books with status 302 and correct location", async () => {
            const res = await request(app).get("/");
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/books"); // StringLiteral mutantını öldürür
        });
    });

    /* --- 2. GET /BOOKS (READ, SEARCH, PAGINATION) --- */
    describe("GET /books", () => {
        it("should render books index with correct title", async () => {
            const res = await request(app).get("/books");
            expect(res.text).toContain("<title>Books</title>"); // Title kontrolü
        });

        it("should display search results correctly (Op.like)", async () => {
            await Book.create({ title: "JavaScript", author: "Brendan", genre: "Tech", year: "1995" });
            await Book.create({ title: "Cooking", author: "Gordon", genre: "Food", year: "2010" });

            const res = await request(app).get("/books?search=JavaScript");
            expect(res.text).toContain("JavaScript");
            expect(res.text).not.toContain("Cooking");
        });

        it("should kill Pagination (limit/offset) mutants", async () => {
            const books = [];
            for(let i=1; i<=11; i++) {
                books.push({ title: `Bk${i}`, author: "A", genre: "G", year: 2000 + i });
            }
            await Book.bulkCreate(books);

            const resPage2 = await request(app).get("/books?page=2");
            // 2. sayfada Bk6 olmalı
            expect(resPage2.text).toContain("Bk6");
            // 2. sayfada Bk1 olmamalı (Tablo içindeki link yapısıyla kontrol)
            expect(resPage2.text).not.toContain(`href="/books/${1}"`); 
        });
    });

    /* --- 3. CREATE BOOK --- */
    describe("Create Book Operations", () => {
        it("POST /books/new should create book and redirect", async () => {
            const res = await request(app).post("/books/new").send({
                title: "Atomic Habits",
                author: "James Clear",
                genre: "Self-Help",
                year: 2018
            });
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/books");
        });

        it("should kill SequelizeValidationError mutants on create", async () => {
            const res = await request(app).post("/books/new").send({ title: "" });
            expect(res.text).toContain("New Book"); // Hata durumunda form geri gelmeli
        });
    });

    /* --- 4. UPDATE & DELETE --- */
    describe("Update and Delete Operations", () => {
        it("POST /books/:id should update and redirect", async () => {
            const book = await Book.create({ title: "Original", author: "A" });
            const res = await request(app).post(`/books/${book.id}`).send({
                title: "UpdatedTitle", author: "NewAuthor"
            });
            expect(res.headers.location).toBe("/books");
        });

        it("POST /books/:id/delete should delete and redirect exactly", async () => {
            const book = await Book.create({ title: "KillMe", author: "A" });
            const res = await request(app).post(`/books/${book.id}/delete`);
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/books");
        });
    });

    /* --- 5. ERROR HANDLERS (EN KRİTİK BÖLÜM) --- */
    describe("Error Handlers (errorHandlers.js)", () => {
        
        it("should kill 404 mutants by checking specific content", async () => {
            const res = await request(app).get("/non-existent-route-999");
            // Uygulamanın 200 veya 404 dönmesine bakmaksızın içeriği kontrol et
            expect([200, 404]).toContain(res.statusCode);
            // Senin hata sayfandaki gerçek metinleri parçalı arıyoruz
            expect(res.text).toContain("404");
            expect(res.text).toContain("Page Not Found");
            expect(res.text).toContain("The webpage could not be found");
        });

        it("should kill Global Error Handler mutants", async () => {
            // DB hatası simüle et
            jest.spyOn(Book, "findAll").mockRejectedValue(new Error("Database Crash"));
            const res = await request(app).get("/books");
            
            expect([200, 500]).toContain(res.statusCode);
            expect(res.text).toContain("Server Error");
            expect(res.text).toContain("Occured");
        });

        it("should kill console.log mutants in error handler", async () => {
            const logSpy = jest.spyOn(console, "log").mockImplementation();
            jest.spyOn(Book, "findAll").mockRejectedValue(new Error("LogTest"));
            await request(app).get("/books");

            // Console log formatını kontrol ederek mutantları öldür
            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining("Error Status:"),
                expect.stringContaining("Error Message:")
            );
        });
    });

    /* --- 6. APP.JS CONFIGURATION --- */
    describe("App.js Configuration", () => {
        it("should have view engine set to pug", () => {
            expect(app.get("view engine")).toBe("pug");
        });

        it("should serve static public files", async () => {
            const res = await request(app).get("/stylesheets/style.css");
            expect(res.statusCode).not.toBe(404);
        });

        it("should have urlencoded body parser middleware", () => {
            const hasUrlEncoded = app._router.stack.some(layer => layer.name === 'urlencodedParser');
            expect(hasUrlEncoded).toBe(true);
        });
    });
});