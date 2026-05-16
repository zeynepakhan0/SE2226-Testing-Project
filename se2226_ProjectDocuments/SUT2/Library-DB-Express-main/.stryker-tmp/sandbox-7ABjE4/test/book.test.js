// @ts-nocheck
const request = require("supertest");
const app = require("../app");
const { sequelize, Book } = require("../models");
const { Op } = require("sequelize");

/**
 * GOD MODE MUTATION KILLER - TARGET: %90+
 * Bu sürüm, matematiksel sınırları (boundary) ve mantıksal kısa devreleri hedef alır.
 */

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterEach(async () => {
    // Veritabanını her testten sonra tertemiz yap
    await Book.destroy({ where: {}, truncate: true });
    jest.restoreAllMocks();
});

describe("God Mode Mutation Killer Suite", () => {

    /* --- 1. SEARCH LOGIC (Op.or & Logic Replacement Killer) --- */
    describe("Search Engine Deep Test", () => {
        it("should kill all 4 search field mutants specifically", async () => {
            // Her alan için ayrı bir kitap ekle ki hangisi bozulursa o test patlasın
            await Book.bulkCreate([
                { title: "S1", author: "A", genre: "G", year: "2001" },
                { title: "T", author: "S2", genre: "G", year: "2002" },
                { title: "T", author: "A", genre: "S3", year: "2003" },
                { title: "T", author: "A", genre: "G", year: "S4" }
            ]);

            const searchTerms = ["S1", "S2", "S3", "S4"];
            for (let term of searchTerms) {
                const res = await request(app).get(`/books?search=${term}`);
                expect(res.text).toContain(term); // Mutant sildiğinde bu patlar
            }
        });

        it("should handle the 'false' branch of if(search)", async () => {
            await Book.create({ title: "VisibleBook", author: "A" });
            const res = await request(app).get("/books"); // search yok
            expect(res.text).toContain("VisibleBook");
        });
    });

    /* --- 2. PAGINATION MATH (Arithmetic Operator Killer) --- */
    describe("Pagination Boundary & Math", () => {
        it("should kill (page * 5 - 5) arithmetic mutants", async () => {
            // 11 kitap ekle. Limit 5.
            const books = Array.from({ length: 11 }, (_, i) => ({
                title: `BK${String(i + 1).padStart(2, '0')}`,
                author: "A"
            }));
            await Book.bulkCreate(books);

            // Sayfa 1: BK01-BK05 olmalı
            const res1 = await request(app).get("/books?page=1");
            expect(res1.text).toContain("BK05");
            expect(res1.text).not.toContain("BK06");

            // Sayfa 2: BK06-BK10 olmalı (Offset 5)
            const res2 = await request(app).get("/books?page=2");
            expect(res2.text).toContain("BK10");
            expect(res2.text).not.toContain("BK05");
            expect(res2.text).not.toContain("BK11");

            // Sayfa 3: Sadece BK11 olmalı (Offset 10)
            const res3 = await request(app).get("/books?page=3");
            expect(res3.text).toContain("BK11");
            expect(res3.text).not.toContain("BK10");
        });

        it("should default to page 1 when query is missing", async () => {
            await Book.create({ title: "FirstPageBook", author: "A" });
            const res = await request(app).get("/books");
            expect(res.text).toContain("FirstPageBook");
        });
    });

    /* --- 3. VALIDATION ERROR MAPPING (Array.map Killer) --- */
    describe("Validation & Catch Blocks", () => {
        it("should kill error.map mutant in POST /books/new", async () => {
            const res = await request(app).post("/books/new").send({ title: "" });
            // 'errors' listesinin boş olmadığını ve render edildiğini doğrula
            expect(res.text).toContain("title"); 
            expect(res.text).toContain("New Book");
        });

        it("should kill error.map mutant in POST /books/:id (Update)", async () => {
            const book = await Book.create({ title: "Old", author: "A" });
            const res = await request(app).post(`/books/${book.id}`).send({ title: "" });
            expect(res.text).toContain("title");
            expect(res.text).toContain("Update Book");
        });

        it("should throw error if update fails with non-validation error", async () => {
            const book = await Book.create({ title: "X", author: "Y" });
            jest.spyOn(Book.prototype, "update").mockRejectedValue(new Error("DB_FAIL"));
            const res = await request(app).post(`/books/${book.id}`).send({ title: "Z" });
            expect(res.text).toContain("DB_FAIL");
        });
    });

    /* --- 4. GLOBAL ERROR HANDLER (Strict Template Killer) --- */
    describe("Error Handling Internal", () => {
        it("should differentiate 404 from Global Error", async () => {
            const res404 = await request(app).get("/not-found-anywhere");
            expect(res404.text).toContain("404");
            
            jest.spyOn(Book, "findAndCountAll").mockRejectedValue(new Error("CUSTOM_500"));
            const res500 = await request(app).get("/books");
            expect(res500.text).toContain("CUSTOM_500");
            expect(res500.text).toContain("Server Error");
        });

        it("should test console.log with both status and message", async () => {
            const logSpy = jest.spyOn(console, "log").mockImplementation();
            const { globalError } = require("../errorHandlers");
            const err = { status: 501, message: "TestMsg" };
            globalError(err, {}, { render: jest.fn() }, {});
            
            // console.log(`Error Status: ${err.status}`, `Error Message: ${err.message}`)
            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining("501"),
                expect.stringContaining("TestMsg")
            );
        });
    });

    /* --- 5. APP.JS CONNECTION IIFE (The Hardest Mutants) --- */
    describe("App Initialization", () => {
        it("should verify connection logs", async () => {
            const logSpy = jest.spyOn(console, "log").mockImplementation();
            // authenticate'i mocklayıp log mesajını yakala
            jest.spyOn(sequelize, "authenticate").mockResolvedValue();
            
            // App.js'i tekrar yüklemek için (IIFE'yi tetiklemek)
            jest.isolateModules(() => {
                require("../app");
            });
            
            // Bir sonraki tick'e kadar bekle (async IIFE için)
            await new Promise(resolve => setImmediate(resolve));
            expect(logSpy).toHaveBeenCalled();
        });

        it("should kill static and urlencoded mutants", async () => {
            const res = await request(app).get("/stylesheets/style.css");
            expect(res.statusCode).toBe(200);
            
            const urlencoded = app._router.stack.find(s => s.name === 'urlencodedParser');
            expect(urlencoded.handle.length).toBe(3); // extended: false kontrolü
        });
    });
});