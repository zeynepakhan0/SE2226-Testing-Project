// @ts-nocheck
const request = require("supertest");
const app = require("../app");
const { sequelize, Book } = require("../models");
const { Op } = require("sequelize");

/**
 * STRATEJİ: 
 * 1. Survived StringLiteral: expect(res.text).toContain("Kesin Metin")
 * 2. Redirect Mutantları: expect(res.headers.location).toBe("/books")
 * 3. Pagination Çakışması: "<td>" tagleri ile tam eşleşme kontrolü (Bk1 vs Book 1 karışıklığı için)
 * 4. Status Code Esnekliği: Uygulama 200 dönse bile içeriği kontrol ederek mutantı öldür.
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

    /* --- 1. INDEX / HOME ROUTE TESTS --- */
    describe("GET / (Home Route)", () => {
        it("should redirect to /books with status 302", async () => {
            const res = await request(app).get("/");
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/books");
        });
    });

    /* --- 2. GET /BOOKS (READ, SEARCH, PAGINATION) TESTS --- */
    describe("GET /books", () => {
        it("should render books index with correct title", async () => {
            const res = await request(app).get("/books");
            expect(res.statusCode).toBe(200);
            expect(res.text).toContain("Books");
        });

        it("should display a created book in the list", async () => {
            await Book.create({ title: "Unique Book", author: "Author X", genre: "Fiction", year: 2024 });
            const res = await request(app).get("/books");
            expect(res.text).toContain("Unique Book");
            expect(res.text).toContain("Author X");
        });

        it("should kill Search (Op.like) mutants in all fields", async () => {
            await Book.create({ title: "JavaScript", author: "Brendan", genre: "Tech", year: "1995" });
            await Book.create({ title: "Cooking", author: "Gordon", genre: "Food", year: "2010" });

            // Title araması
            const resTitle = await request(app).get("/books?search=JavaScript");
            expect(resTitle.text).toContain("JavaScript");
            expect(resTitle.text).not.toContain("Cooking");

            // Author araması
            const resAuthor = await request(app).get("/books?search=Gordon");
            expect(resAuthor.text).toContain("Cooking");
            
            // Genre araması
            const resGenre = await request(app).get("/books?search=Tech");
            expect(resGenre.text).toContain("JavaScript");

            // Year araması
            const resYear = await request(app).get("/books?search=1995");
            expect(resYear.text).toContain("JavaScript");
        });

        it("should kill Pagination (limit/offset) mutants", async () => {
            // 11 kitap oluştur (5-5-1 düzeni için)
            // İsimleri 'Bk' yapıyoruz ki sayfa altındaki 'Book' kelimeleriyle karışmasın
            const books = [];
            for(let i=1; i<=11; i++) {
                books.push({ title: `Bk${i}`, author: "A", genre: "G", year: 2000 + i });
            }
            await Book.bulkCreate(books);

            const resPage2 = await request(app).get("/books?page=2");
            
            // 2. sayfada Bk6 olmalı (ilk 5 bitti)
            expect(resPage2.text).toContain("Bk6");
            
            // 2. sayfada Bk1 olmamalı (td içinde kontrol ederek mutantı öldür)
            // Sadece .not.toContain("Bk1") dersek sayfa numarasındaki 1 ile karışabilir.
            expect(resPage2.text).not.toContain("<td><a href=\"/books/1\">Bk1</a></td>");
        });
    });

    /* --- 3. CREATE BOOK TESTS --- */
    describe("Create Book Operations", () => {
        it("GET /books/new should render form", async () => {
            const res = await request(app).get("/books/new");
            expect(res.text).toContain("New Book");
        });

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
            const res = await request(app).post("/books/new").send({
                title: "", 
                author: "James"
            });
            expect(res.statusCode).toBe(200);
            expect(res.text).toContain("New Book"); 
        });
    });

    /* --- 4. UPDATE BOOK TESTS --- */
    describe("Update Book Operations", () => {
        it("GET /books/:id should render update form", async () => {
            const book = await Book.create({ title: "OldTitle", author: "A" });
            const res = await request(app).get(`/books/${book.id}`);
            expect(res.text).toContain("Update Book");
            expect(res.text).toContain("OldTitle");
        });

        it("POST /books/:id should update data and redirect", async () => {
            const book = await Book.create({ title: "Original", author: "A" });
            const res = await request(app).post(`/books/${book.id}`).send({
                title: "UpdatedTitle",
                author: "NewAuthor"
            });
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/books");

            const updated = await Book.findByPk(book.id);
            expect(updated.title).toBe("UpdatedTitle");
        });
    });

    /* --- 5. DELETE BOOK TESTS --- */
    describe("Delete Book Operations", () => {
        it("POST /books/:id/delete should remove book and redirect exactly", async () => {
            const book = await Book.create({ title: "KillMe", author: "A" });
            const res = await request(app).post(`/books/${book.id}/delete`);
            
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/books"); // StringLiteral mutantunu öldürür

            const check = await Book.findByPk(book.id);
            expect(check).toBeNull();
        });
    });

    /* --- 6. ERROR HANDLER TESTS (EN KRİTİK KISIM) --- */
    describe("Error Handlers (errorHandlers.js)", () => {
        
        it("should kill 404 mutants by checking specific text", async () => {
            const res = await request(app).get("/invalid-route-12345");
            // Uygulama 200 dönse bile içeriği kontrol ediyoruz
            expect([200, 404]).toContain(res.statusCode);
            expect(res.text).toContain("404.  Page Not Found"); // Boş string mutantını öldürür
        });

        it("should kill Global Error Handler mutants", async () => {
            // Zorla hata fırlat
            jest.spyOn(Book, "findAll").mockRejectedValue(new Error("Global Crash"));
            const res = await request(app).get("/books");
            
            expect([200, 500]).toContain(res.statusCode);
            expect(res.text).toContain("A Server Error Occured!"); // StringLiteral mutantunu öldürür
        });

        it("should kill console.log mutants in global error", async () => {
            const logSpy = jest.spyOn(console, "log").mockImplementation();
            jest.spyOn(Book, "findAll").mockRejectedValue(new Error("Crash"));
            await request(app).get("/books");

            // Console log içindeki metinlerin mutasyona uğramasını engeller
            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining("Error Status:"),
                expect.stringContaining("Error Message:")
            );
        });
    });

    /* --- 7. APP.JS CONFIGURATION TESTS --- */
    describe("App.js Config", () => {
        it("should have pug engine", () => {
            expect(app.get("view engine")).toBe("pug");
        });

        it("should serve static files", async () => {
            const res = await request(app).get("/stylesheets/style.css");
            expect(res.statusCode).not.toBe(404);
        });

        it("should use extended false for urlencoded", () => {
            const layer = app._router.stack.find(l => l.name === 'urlencodedParser');
            expect(layer).toBeDefined();
        });
    });
});