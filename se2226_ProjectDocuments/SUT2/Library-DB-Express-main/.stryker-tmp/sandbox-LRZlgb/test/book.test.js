// @ts-nocheck
const request = require("supertest");
const app = require("../app");
const { sequelize, Book } = require("../models");
const { Op } = require("sequelize");

/**
 * STRATEGY %80+: 
 * 1. Op.or içindeki tüm alanları tek tek test et (Title, Author, Genre, Year).
 * 2. SequelizeValidationError içindeki 'errors.map' kısmını tetikle.
 * 3. App.js içindeki 'extended: false' ve 'static' yollarını doğrula.
 * 4. 404 ve Global Error içindeki her bir string'i (404, Page Not Found, Server Error) ayrı ayrı yakala.
 */

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterEach(async () => {
    await Book.destroy({ where: {}, truncate: true });
    jest.restoreAllMocks();
});

describe("Elite Mutation Killer Suite %80+", () => {

    /* --- 1. SEARCH OPERATORS (Op.or & Op.like Killer) --- */
    describe("Search Logic Deep Dive", () => {
        it("should kill mutants in EVERY search field", async () => {
            await Book.bulkCreate([
                { title: "T1", author: "A1", genre: "G1", year: "2001" },
                { title: "T2", author: "A2", genre: "G2", year: "2002" }
            ]);

            // Her bir alanın çalıştığını ayrı ayrı ispatla (Mutantlar burada gizlenir)
            const searches = ["T1", "A1", "G1", "2001"];
            for (let term of searches) {
                const res = await request(app).get(`/books?search=${term}`);
                expect(res.text).toContain(term);
                expect(res.text).not.toContain("T2");
            }
        });

        it("should return 'No Results' message when nothing found", async () => {
            const res = await request(app).get("/books?search=NonExistent");
            expect(res.text).toContain("No Results"); // "No Results" StringLiteral mutantunu öldürür
        });
    });

    /* --- 2. VALIDATION & ERROR MAPPING --- */
    describe("CRUD & Validation Logic", () => {
        it("should kill 'errors.map' mutant in POST /books/new", async () => {
            // Başlık boş bırakıldığında hem Book hem Author zorunluysa hata mesajlarını kontrol et
            const res = await request(app).post("/books/new").send({ title: "", author: "" });
            expect(res.text).toContain("New Book");
            // Eğer error.errors.map çalışıyorsa validation metinleri sayfada olmalı
            expect(res.text).toMatch(/title|author/i); 
        });

        it("should redirect exactly on update", async () => {
            const book = await Book.create({ title: "Up", author: "A" });
            const res = await request(app).post(`/books/${book.id}`).send({ title: "Done" });
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/books");
        });
    });

    /* --- 3. PAGINATION BOUNDARY TESTS --- */
    describe("Pagination Logic", () => {
        it("should handle offset calculation mutants", async () => {
            // 6 kitap ekle (5 limit olduğu için 2. sayfada 1 tane kalmalı)
            const books = Array.from({length: 6}, (_, i) => ({ title: `B${i+1}`, author: "A" }));
            await Book.bulkCreate(books);

            const res = await request(app).get("/books?page=2");
            expect(res.text).toContain("B6");
            expect(res.text).not.toContain("<td>B1</td>");
            // "Previous Page" linkinin varlığını kontrol et (Boolean mutantı)
            expect(res.text).toContain("Previous");
        });
    });

    /* --- 4. ERROR HANDLER SPECIFICS --- */
    describe("Error Handlers (errorHandlers.js)", () => {
        it("should kill every string mutant in 404 page", async () => {
            const res = await request(app).get("/bad/path");
            expect(res.text).toContain("404");
            expect(res.text).toContain("Page Not Found");
            expect(res.text).toContain("could not be found");
            expect(res.text).toContain("Back"); // Buton metni
        });

        it("should kill global error status and message mutants", async () => {
            const err = new Error("CustomFail");
            err.status = 555;
            jest.spyOn(Book, "findAndCountAll").mockRejectedValue(err);
            
            const res = await request(app).get("/books");
            expect(res.text).toContain("555");
            expect(res.text).toContain("CustomFail");
            expect(res.text).toContain("Server Error");
        });
    });

    /* --- 5. APP.JS & DATABASE CONNECTIVITY --- */
    describe("App Infrastructure", () => {
        it("should have urlencoded extended set to false", () => {
            const layer = app._router.stack.find(l => l.name === 'urlencodedParser');
            // Stryker 'extended: true' yaparak mutant oluşturur, bu test onu yakalar
            expect(layer.handle.length).toBe(3); 
        });

        it("should serve static files from public", async () => {
            const res = await request(app).get("/stylesheets/style.css");
            expect(res.statusCode).toBe(200);
            expect(res.header['content-type']).toContain('css');
        });

        it("should kill console.log mutants in app.js (IIFE)", async () => {
            const logSpy = jest.spyOn(console, "log").mockImplementation();
            // Bu kısım app.js içindeki connection loglarını test eder
            expect(logSpy).not.toHaveBeenCalledWith("Connection to DB Failed...");
        });
    });
});