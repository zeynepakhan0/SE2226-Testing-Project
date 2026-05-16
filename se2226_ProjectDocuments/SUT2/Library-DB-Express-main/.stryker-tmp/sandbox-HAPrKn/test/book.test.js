// @ts-nocheck
const request = require("supertest");
const app = require("../app");
const { sequelize, Book } = require("../models");
const { Op } = require("sequelize");

/**
 * STRATEJİ: 
 * 1. StringLiteral Mutantlarını Öldürmek: expect(res.text).toContain("Kesin Metin")
 * 2. Redirect Mutantlarını Öldürmek: expect(res.headers.location).toBe("/books")
 * 3. Logical/Boolean Mutantlarını Öldürmek: Hem doğru hem yanlış caseleri denemek.
 */

beforeAll(async () => {
    // Veritabanını temizle ve hazırla
    await sequelize.sync({ force: true });
});

afterEach(async () => {
    // Her testten sonra veritabanını temizle ki ID'ler karışmasın
    await Book.destroy({ where: {}, truncate: true });
    jest.restoreAllMocks();
});

describe("Comprehensive Mutation Killer Suite", () => {

    /* --- 1. INDEX / HOME ROUTE TESTS --- */
    describe("GET / (Home Route)", () => {
        it("should redirect to /books with status 302", async () => {
            const res = await request(app).get("/");
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/books"); // StringLiteral mutantını öldürür
        });
    });

    /* --- 2. GET /BOOKS (READ, SEARCH, PAGINATION) TESTS --- */
    describe("GET /books", () => {
        it("should render books index with correct title", async () => {
            const res = await request(app).get("/books");
            expect(res.statusCode).toBe(200);
            expect(res.text).toContain("Books"); // Pug dosyasındaki title kontrolü
        });

        it("should display a created book in the list", async () => {
            await Book.create({ title: "Unique Book", author: "Author X", genre: "Fiction", year: 2024 });
            const res = await request(app).get("/books");
            expect(res.text).toContain("Unique Book");
            expect(res.text).toContain("Author X");
        });

        it("should kill Search (Op.like) mutants", async () => {
            await Book.create({ title: "JavaScript Guide", author: "John", genre: "Tech", year: 2020 });
            await Book.create({ title: "Cooking 101", author: "Jane", genre: "Food", year: 2021 });

            // Title araması
            const resTitle = await request(app).get("/books?search=JavaScript");
            expect(resTitle.text).toContain("JavaScript Guide");
            expect(resTitle.text).not.toContain("Cooking 101");

            // Author araması (Op.or mutantlarını öldürür)
            const resAuthor = await request(app).get("/books?search=Jane");
            expect(resAuthor.text).toContain("Cooking 101");
            
            // Genre araması
            const resGenre = await request(app).get("/books?search=Tech");
            expect(resGenre.text).toContain("JavaScript Guide");
        });

        it("should kill Pagination (limit/offset) mutants", async () => {
            // 11 kitap oluştur (5-5-1 düzeni için)
            const books = [];
            for(let i=1; i<=11; i++) {
                books.push({ title: `Book ${i}`, author: "A", genre: "G", year: 2000 + i });
            }
            await Book.bulkCreate(books);

            const resPage2 = await request(app).get("/books?page=2");
            expect(resPage2.text).toContain("Book 6");
            expect(resPage2.text).not.toContain("Book 1"); // Offset mutantunu öldürür
            expect(resPage2.text).not.toContain("Book 11"); // Limit mutantunu öldürür
        });
    });

    /* --- 3. CREATE BOOK TESTS (NEW & POST) --- */
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

            const book = await Book.findOne({ where: { title: "Atomic Habits" } });
            expect(book).not.toBeNull();
        });

        it("should kill SequelizeValidationError mutants on create", async () => {
            const res = await request(app).post("/books/new").send({
                title: "", // Boş bırakarak hata tetikle (Sequelize validation)
                author: "James"
            });
            expect(res.statusCode).toBe(200);
            expect(res.text).toContain("New Book"); // Hata durumunda formu tekrar yüklemeli
        });
    });

    /* --- 4. UPDATE BOOK TESTS --- */
    describe("Update Book Operations", () => {
        it("GET /books/:id should render update form", async () => {
            const book = await Book.create({ title: "Old", author: "A" });
            const res = await request(app).get(`/books/${book.id}`);
            expect(res.text).toContain("Update Book");
            expect(res.text).toContain("Old");
        });

        it("POST /books/:id should update data and redirect", async () => {
            const book = await Book.create({ title: "Old", author: "A" });
            const res = await request(app).post(`/books/${book.id}`).send({
                title: "New Title",
                author: "New Author"
            });
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/books");

            const updated = await Book.findByPk(book.id);
            expect(updated.title).toBe("New Title");
        });

        it("should kill ValidationError mutants on update", async () => {
            const book = await Book.create({ title: "Valid", author: "A" });
            const res = await request(app).post(`/books/${book.id}`).send({
                title: "" // Hata tetikle
            });
            expect(res.text).toContain("Update Book");
        });
    });

    /* --- 5. DELETE BOOK TESTS --- */
    describe("Delete Book Operations", () => {
        it("POST /books/:id/delete should remove book", async () => {
            const book = await Book.create({ title: "To Be Deleted", author: "A" });
            const res = await request(app).post(`/books/${book.id}/delete`);
            
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/books");

            const check = await Book.findByPk(book.id);
            expect(check).toBeNull(); // Silme mutantunu öldürür
        });
    });

    /* --- 6. ERROR HANDLER TESTS (CRITICAL FOR SCORE) --- */
    describe("Error Handlers (errorHandlers.js)", () => {
        
        it("should kill 404 (fourOhFour) mutants", async () => {
            const res = await request(app).get("/this/route/does/not/exist");
            expect(res.statusCode).toBe(404);
            // Survived StringLiteral: '404.  Page Not Found' mutantunu öldürür
            expect(res.text).toContain("404.  Page Not Found");
        });

        it("should kill Global Error Handler status mutants", async () => {
            // Sequelize crash taklidi yaparak 500 hatasını zorla
            jest.spyOn(Book, "findAll").mockRejectedValue(new Error("Global Crash"));
            const res = await request(app).get("/books");
            
            expect(res.statusCode).toBe(500);
            // errorHandlers.js line 18: err.message mutantunu öldürür
            expect(res.text).toContain("A Server Error Occured!");
        });

        it("should kill console.log mutants in error handler", async () => {
            const logSpy = jest.spyOn(console, "log").mockImplementation();
            // 500 hatası tetikle
            jest.spyOn(Book, "findAll").mockRejectedValue(new Error("Crash"));
            await request(app).get("/books");

            // console.log içindeki StringLiteral mutantlarını öldürür
            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining("Error Status: 500"),
                expect.stringContaining("Error Message:")
            );
        });
    });

    /* --- 7. APP.JS CONFIGURATION TESTS --- */
    describe("App.js Global Configs", () => {
        it("should kill app.set view engine mutant", () => {
            expect(app.get("view engine")).toBe("pug");
        });

        it("should kill express.static mutant", async () => {
            // Public klasöründen bir dosya iste (varsa)
            const res = await request(app).get("/stylesheets/style.css");
            expect(res.statusCode).not.toBe(404);
        });

        it("should kill urlencoded extended mutant", () => {
            // app stack'inde urlencoded ayarını kontrol et
            const urlEncodedLayer = app._router.stack.find(l => l.name === 'urlencodedParser');
            expect(urlEncodedLayer).toBeDefined();
        });
    });
});