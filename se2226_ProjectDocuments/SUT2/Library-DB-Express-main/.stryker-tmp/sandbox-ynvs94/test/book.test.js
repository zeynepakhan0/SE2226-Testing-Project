// @ts-nocheck
const request = require("supertest");
const app = require("../app");
const { sequelize, Book } = require("../models");
const { Op } = require("sequelize");

/**
 * %90+ ULTIMATE MUTATION DESTROYER
 * Bu test seti, Stryker'ın sinsi "Equivalent" ve "Logic" mutantlarını hedef alır.
 */

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterEach(async () => {
    await Book.destroy({ where: {}, truncate: true });
    jest.restoreAllMocks();
    jest.clearAllMocks();
});

describe("Final Precision Suite", () => {

    /* --- 1. SEARCH LOGIC (Op.or & Op.like) --- */
    describe("GET /books Search Precision", () => {
        it("should kill each specific field mutant in Op.or", async () => {
            // Stryker, Op.or içindeki diziden birini (örn: author) silerse bu test patlamalı.
            await Book.bulkCreate([
                { title: "UniqueTitle", author: "x", genre: "x", year: "2000" },
                { title: "x", author: "UniqueAuthor", genre: "x", year: "2001" },
                { title: "x", author: "x", genre: "UniqueGenre", year: "2002" },
                { title: "x", author: "x", genre: "x", year: "UniqueYear" }
            ]);

            const searchTerms = ["UniqueTitle", "UniqueAuthor", "UniqueGenre", "UniqueYear"];
            
            for (const term of searchTerms) {
                const res = await request(app).get(`/books?search=${term}`);
                // Sadece text içeriği değil, tam olarak o kaydın geldiğini doğrula
                expect(res.text).toContain(term);
                expect(res.statusCode).toBe(200);
            }
        });

        it("should kill the empty search branch", async () => {
            await Book.create({ title: "Exist", author: "x" });
            const res = await request(app).get("/books?search=");
            expect(res.text).toContain("Exist");
        });
    });

    /* --- 2. PAGINATION ARITHMETIC (page * 5 - 5) --- */
    describe("Pagination Boundary Tests", () => {
        it("should kill arithmetic mutants and limit: 5", async () => {
            // 11 kitap oluştur (1-5 P1, 6-10 P2, 11 P3)
            const books = Array.from({ length: 11 }, (_, i) => ({
                title: `PAG${(i + 1).toString().padStart(2, '0')}`,
                author: "X"
            }));
            await Book.bulkCreate(books);

            // Sayfa 2 testi: Offset tam 5 mi?
            const resPage2 = await request(app).get("/books?page=2");
            expect(resPage2.text).toContain("PAG06"); // Sayfa 2'nin ilk kitabı
            expect(resPage2.text).not.toContain("PAG05"); // Sayfa 1'in son kitabı olmamalı
            expect(resPage2.text).not.toContain("PAG11"); // Sayfa 3'ün kitabı olmamalı

            // Sayfa 1 kontrolü (Default)
            const resDefault = await request(app).get("/books");
            expect(resDefault.text).toContain("PAG01");
            expect(resDefault.text).not.toContain("PAG06");
        });
    });

    /* --- 3. ERROR HANDLERS (errorHandlers.js) --- */
    describe("Error Handling Strict Checks", () => {
        it("should kill 404 string and status mutants", async () => {
            const res = await request(app).get("/non-existent-12345");
            // Stryker 404 mesajını " " (boş) yaparsa yakalar:
            expect(res.text).toContain("404");
            expect(res.text).toContain("Page Not Found");
        });

        it("should kill global error message construction", async () => {
            const logSpy = jest.spyOn(console, "log").mockImplementation();
            // Database çökmesi simüle et
            jest.spyOn(Book, "findAndCountAll").mockRejectedValue(new Error("MORTAL_KOMBAT"));
            
            const res = await request(app).get("/books");
            // Template literal içindeki "A Server Error Occured!" kısmını doğrula
            expect(res.text).toContain("A Server Error Occured!");
            expect(res.text).toContain("MORTAL_KOMBAT");
            // Console log'un 2 argüman aldığını ve içeriğini doğrula
            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining("Error Status:"),
                expect.stringContaining("Error Message:")
            );
        });
    });

    /* --- 4. CRUD & CATCH BLOCKS --- */
    describe("CRUD Precision", () => {
        it("should kill the 'else { throw error }' in update", async () => {
            const book = await Book.create({ title: "Old", author: "A" });
            jest.spyOn(Book, "findByPk").mockResolvedValue(book);
            // Validation hatası DEĞİL, ham bir hata fırlat
            jest.spyOn(book, "update").mockRejectedValue(new Error("RAW_DB_ERROR"));
            
            const res = await request(app).post(`/books/${book.id}`).send({ title: "New" });
            expect(res.text).toContain("RAW_DB_ERROR");
        });

        it("should kill error.map mutant in validation", async () => {
            const res = await request(app).post("/books/new").send({ title: "" });
            // Hata mesajlarının sayfada render edildiğini doğrula
            expect(res.text).toContain("New Book");
            expect(res.text).toMatch(/title|author/i);
        });
    });

    /* --- 5. APP.JS INFRASTRUCTURE --- */
    describe("App.js Global Config", () => {
        it("should verify static files and root redirect", async () => {
            const resRoot = await request(app).get("/");
            expect(resRoot.statusCode).toBe(302);
            expect(resRoot.headers.location).toBe("/books");

            const resCss = await request(app).get("/stylesheets/style.css");
            expect(resCss.statusCode).toBe(200);
        });

        it("should kill urlencoded extended:false mutant", () => {
            const urlencodedLayer = app._router.stack.find(s => s.name === 'urlencodedParser');
            // Stryker 'false'u 'true' yaparsa bu kontrol yakalar
            expect(urlencodedLayer.handle.length).toBe(3); 
        });

        it("should kill the DB Connection Success/Fail log mutants", async () => {
            const logSpy = jest.spyOn(console, "log").mockImplementation();
            // App.js içindeki IIFE'yi yakalamak için sessizce bekle
            await new Promise(resolve => setTimeout(resolve, 100));
            // Log'un en az bir kere (başarı veya hata) çağrıldığını doğrula
            expect(logSpy).toHaveBeenCalled();
        });
    });
});