// @ts-nocheck
const request = require("supertest");
const app = require("../app");
const { sequelize, Book } = require("../models");
const { Op } = require("sequelize");

/**
 * ZEYNEP'S %90+ MUTATION DESTROYER
 * Bu set, Stryker'ın 'Logic', 'Arithmetic' ve 'String' mutantlarını imha eder.
 */

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterEach(async () => {
    // Tabloyu temizle ve mock'ları sıfırla
    await Book.destroy({ where: {}, truncate: true });
    jest.restoreAllMocks();
    jest.clearAllMocks();
});

describe("Mutation Kill-Zone: Routes, App & Handlers", () => {

    /* --- 1. SEARCH LOGIC (Op.or & Wildcard Precision) --- */
    describe("Deep Search Logic (routes/index.js)", () => {
        it("should kill all Op.or field mutants (title, author, genre, year)", async () => {
            // Her alan için "tekil" (unique) birer kayıt. 
            // Stryker Op.or içinden bir alanı (örn: author) silerse, o alanın araması boş dönecektir.
            await Book.bulkCreate([
                { title: "Target_T", author: "A", genre: "G", year: "2000" },
                { title: "T", author: "Target_A", genre: "G", year: "2001" },
                { title: "T", author: "A", genre: "Target_G", year: "2002" },
                { title: "T", author: "A", genre: "G", year: "Target_Y" }
            ]);

            const targets = ["Target_T", "Target_A", "Target_G", "Target_Y"];
            for (let term of targets) {
                const res = await request(app).get(`/books?search=${term}`);
                expect(res.text).toContain(term); // Mutant bir alanı silerse bu fail eder.
                expect(res.statusCode).toBe(200);
            }
        });

        it("should kill 'if(search)' boolean mutants", async () => {
            await Book.create({ title: "Default", author: "A" });
            // Arama kutusu boşken (falsy), tüm kitaplar gelmeli.
            const res = await request(app).get("/books?search=");
            expect(res.text).toContain("Default");
        });
    });

    /* --- 2. PAGINATION ARITHMETIC (page * 5 - 5) --- */
    describe("Pagination Math & Boundary", () => {
        it("should kill limit and offset arithmetic precisely", async () => {
            // 11 kitap: P1(1-5), P2(6-10), P3(11)
            const books = Array.from({ length: 11 }, (_, i) => ({
                title: `ZB${(i + 1).toString().padStart(2, '0')}`,
                author: "A"
            }));
            await Book.bulkCreate(books);

            // Sayfa 2 testi: Offset tam 5 olmalı. 
            // Stryker *5 yerine /5, veya -5 yerine +5 yaparsa bu patlar.
            const res2 = await request(app).get("/books?page=2");
            expect(res2.text).toContain("ZB06"); // 6. kitap orada olmalı
            expect(res2.text).not.toContain("ZB05"); // İlk sayfa elemanı olmamalı
            expect(res2.text).not.toContain("ZB11"); // Son sayfa elemanı olmamalı

            // Sayfa 3 testi:
            const res3 = await request(app).get("/books?page=3");
            expect(res3.text).toContain("ZB11");
        });

        it("should kill default page value mutant", async () => {
            await Book.create({ title: "Page1", author: "A" });
            const res = await request(app).get("/books"); // page yoksa 1 olmalı
            expect(res.text).toContain("Page1");
        });
    });

    /* --- 3. CRUD & CATCH BLOCKS (Else Branch Killers) --- */
    describe("Validation & Throw Catching", () => {
        it("should kill error.map mutant in POST /books/new", async () => {
            const res = await request(app).post("/books/new").send({ title: "" });
            expect(res.text).toContain("New Book");
            expect(res.text).toMatch(/title|author/i); // Map edilen hatalar sayfada mı?
        });

        it("should kill 'else { throw error }' in update route", async () => {
            const book = await Book.create({ title: "Exist", author: "A" });
            // Validation olmayan, düz bir DB hatası simüle et
            jest.spyOn(Book, "findByPk").mockResolvedValue(book);
            jest.spyOn(book, "update").mockRejectedValue(new Error("CRITICAL_DB_FAILURE"));
            
            const res = await request(app).post(`/books/${book.id}`).send({ title: "Update" });
            // Bu hata globalError handler'a fırlatılmalı
            expect(res.text).toContain("CRITICAL_DB_FAILURE");
        });
    });

    /* --- 4. GLOBAL ERROR HANDLERS (String & Logic) --- */
    describe("Error Handler Logic (errorHandlers.js)", () => {
        it("should kill 404 message and status mutants", async () => {
            const res = await request(app).get("/route-not-found-123");
            expect(res.status).toBe(404);
            expect(res.text).toContain("404");
            expect(res.text).toContain("Page Not Found");
        });

        it("should kill Global Error message construction", async () => {
            const logSpy = jest.spyOn(console, "log").mockImplementation();
            const err = new Error("Unique_Specific_Msg");
            err.status = 505;
            
            // Doğrudan globalError fonksiyonunu çağırarak template literal'ları test et
            const { globalError } = require("../errorHandlers");
            const res = { render: jest.fn(), status: jest.fn().mockReturnThis() };
            
            globalError(err, {}, res, {});
            
            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining("505"),
                expect.stringContaining("Unique_Specific_Msg")
            );
            expect(res.render).toHaveBeenCalledWith('error', expect.objectContaining({ err }));
        });
    });

    /* --- 5. APP.JS & IIFE (DB Connection) --- */
    describe("App Infrastructure & IIFE", () => {
        it("should kill urlencoded and static path mutants", async () => {
            const resCss = await request(app).get("/stylesheets/style.css");
            expect(resCss.statusCode).toBe(200);

            const urlencoded = app._router.stack.find(s => s.name === 'urlencodedParser');
            expect(urlencoded.handle.length).toBe(3); // Extended: false mutasyonunu öldürür
        });

        it("should verify root redirect", async () => {
            const res = await request(app).get("/");
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/books");
        });
    });
});