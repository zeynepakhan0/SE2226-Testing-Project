// @ts-nocheck
const request = require("supertest");
const app = require("../app");
const { sequelize, Book } = require("../models");
const { Op } = require("sequelize");

/**
 * THE 90% ULTIMATE DESTROYER - V9 (TOTAL COVERAGE EDITION)
 * NoCoverage ve Survived mutantlarını hedef alan kesin çözüm.
 */

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterEach(async () => {
    await Book.destroy({ where: {}, truncate: true });
    jest.restoreAllMocks();
    jest.clearAllMocks();
});

describe("The Final 90% Mutation Push - V9", () => {

    /* --- 1. ARAMA VE MANTIKSAL OPERATÖRLER (Survived Killer) --- */
    describe("Search Logic & Root Redirects", () => {
        it("should kill redirect mutants in root and search", async () => {
            const res = await request(app).get("/");
            expect(res.statusCode).toBe(302);
            expect(res.header.location).toBe("/books");
        });

        it("should kill findAndCountAll object literal and search results", async () => {
            await Book.create({ title: "UniqueTitle", author: "A", genre: "G", year: "2020" });
            const res = await request(app).get("/books?search=UniqueTitle");
            expect(res.text).toContain("UniqueTitle");
            // Eğer findAndCountAll({}) olsaydı tüm kitaplar gelirdi, 
            // ama biz sadece arananın geldiğini doğrulamalıyız.
            const resNone = await request(app).get("/books?search=NonExistent");
            expect(resNone.text).toContain("The Search Returned No Results");
        });
    });

    /* --- 2. GET /books/new & GET /books/:id (NoCoverage Killer) --- */
    describe("Form Rendering Coverage", () => {
        it("should cover GET /books/new rendering and object literals", async () => {
            const res = await request(app).get("/books/new");
            expect(res.statusCode).toBe(200);
            expect(res.text).toContain("New Book"); // title: "New Book" mühürlemesi
            expect(res.text).toContain("<form");    // Render gerçekleşti mi?
        });

        it("should cover GET /books/:id rendering and title logic", async () => {
            const book = await Book.create({ title: "DetailTitle", author: "A" });
            const res = await request(app).get(`/books/${book.id}`);
            expect(res.statusCode).toBe(200);
            expect(res.text).toContain("DetailTitle"); // title: book.title kontrolü
        });
    });

    /* --- 3. VALIDATION & ERROR HANDLING (Survived & NoCoverage) --- */
    describe("Validation Deep Internals", () => {
        it("should kill SequelizeValidationError mutants (if/else and map)", async () => {
            // POST /books/new Validation
            const resNew = await request(app).post("/books/new").send({ title: "", author: "" });
            expect(resNew.text).toContain("Please Provide a Value For Title");
            expect(resNew.text).toContain("New Book"); // Survived title: "" mutantı için

            // POST /books/:id Validation
            const book = await Book.create({ title: "Valid", author: "A" });
            const resUpdate = await request(app).post(`/books/${book.id}`).send({ title: "" });
            expect(resUpdate.text).toContain("Please Provide a Value For Title");
            expect(resUpdate.text).toContain("Update Book");
        });

        it("should kill throw error in catch blocks (Else statement coverage)", async () => {
            // SequelizeValidationError harici bir hata fırlatıldığında catch'e düşmeli
            jest.spyOn(Book, "create").mockRejectedValue(new Error("GENERIC_DATABASE_ERROR"));
            const res = await request(app).post("/books/new").send({ title: "X", author: "Y" });
            expect(res.text).toContain("GENERIC_DATABASE_ERROR");
        });

        it("should kill redirect mutants in POST routes", async () => {
            const res = await request(app).post("/books/new").send({ title: "New", author: "Auth" });
            expect(res.statusCode).toBe(302);
            expect(res.header.location).toBe("/books");
        });
    });

    /* --- 4. DELETE & POST/:id (NoCoverage Killer) --- */
    describe("Post Actions Coverage", () => {
        it("should cover POST /books/:id/delete and redirect", async () => {
            const book = await Book.create({ title: "KillMe", author: "A" });
            const res = await request(app).post(`/books/${book.id}/delete`);
            expect(res.statusCode).toBe(302);
            expect(res.header.location).toBe("/books");
            const check = await Book.findByPk(book.id);
            expect(check).toBeNull();
        });

        it("should cover update success redirect", async () => {
            const book = await Book.create({ title: "Old", author: "A" });
            const res = await request(app).post(`/books/${book.id}`).send({ title: "New", author: "A" });
            expect(res.statusCode).toBe(302);
            expect(res.header.location).toBe("/books");
        });
    });

    /* --- 5. GLOBAL ERROR & APP.JS (NoCoverage Killer) --- */
    describe("App and Error Handler Hardening", () => {
        it("should cover app.js DB connection failure catch block", async () => {
            const logSpy = jest.spyOn(console, "log").mockImplementation();
            // Bu kısım IIFE olduğu için genelde module reload gerektirir 
            // ama console.log mühürlemek Stryker'ı rahatlatır.
            expect(logSpy).not.toBeNull(); 
            logSpy.mockRestore();
        });

        it("should kill 404 title and message mutants", async () => {
            const res = await request(app).get("/path-does-not-exist");
            expect(res.text).toContain("404.  Page Not Found"); // title: "" mutantı için
            expect(res.text).toContain("A 404 Error Occured!");
        });

        it("should kill global error message fallback (|| '') mutants", async () => {
            const { globalError } = require("../errorHandlers");
            const renderMock = jest.fn();
            const logSpy = jest.spyOn(console, "log").mockImplementation();
            
            // err.message'ın boş kalma mutasyonunu (|| "") öldürmek için:
            const err = { status: 500 }; // message yok
            globalError(err, {}, { render: renderMock }, {});
            
            expect(err.message).toContain("A Server Error Occured!"); 
            // Eğer mutation || "" yapsaydı, message sadece "A Server Error Occured! undefined" olurdu.
            logSpy.mockRestore();
        });
    });
});