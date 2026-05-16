// @ts-nocheck
const request = require("supertest");
const app = require("../app");
const { sequelize, Book } = require("../models");
const { Op } = require("sequelize");

/**
 * THE 90% ULTIMATE DESTROYER - V3 (FINAL SHIELD)
 * Stryker skorunu %90+ yapmak için tüm fallback ve mantık hatalarını mühürler.
 */

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterEach(async () => {
    await Book.destroy({ where: {}, truncate: true });
    jest.restoreAllMocks();
    jest.clearAllMocks();
});

describe("The Final 90% Mutation Push - V3", () => {

    /* --- 1. SEARCH & EMPTY STATE --- */
    describe("Deep Search & Logic", () => {
        it("should kill search logic and empty state mutants", async () => {
            await Book.create({ title: "Unique", author: "Author", genre: "G", year: "2020" });

            // 1. Başarılı arama (Mevcut mantık)
            const resFound = await request(app).get("/books?search=Unique");
            expect(resFound.text).toContain("Unique");

            // 2. Sonuç bulunamayan arama (Boolean mutantlarını öldürür)
            const resEmpty = await request(app).get("/books?search=NonExistentBook123");
            expect(resEmpty.text).toContain("No books found"); // HTML'de bu mesajın varlığını doğrula
        });

        it("should handle empty search string to kill if(search) mutants", async () => {
            await Book.create({ title: "AnyBook", author: "A" });
            const res = await request(app).get("/books?search=");
            expect(res.text).toContain("AnyBook"); 
        });
    });

    /* --- 2. PAGINATION & DEFAULT VALUE KILLER --- */
    describe("Pagination Arithmetic & Defaults", () => {
        it("should kill default page (|| 1) and math mutants", async () => {
            // 11 kitap oluştur
            const books = Array.from({ length: 11 }, (_, i) => ({
                title: `ZB${String(i + 1).padStart(2, '0')}`,
                author: "A"
            }));
            await Book.bulkCreate(books);

            // 1. Sayfa parametresi verilmediğinde varsayılan (page=1) çalışıyor mu?
            const resDefault = await request(app).get("/books");
            expect(resDefault.text).toContain("ZB01");
            expect(resDefault.text).not.toContain("ZB06");

            // 2. Sayfa 2 matematiği (page * 5 - 5)
            const res2 = await request(app).get("/books?page=2");
            expect(res2.text).toContain("ZB06");
            expect(res2.text).not.toContain("ZB05");
            
            // 3. Linklerin mühürlenmesi
            expect(res2.text).toContain("page=1");
            expect(res2.text).toContain("page=3");
        });
    });

    /* --- 3. CRUD & CATCH BLOCK MAPPING --- */
    describe("Validation & Catch Blocks", () => {
        it("should kill error.map mutant in POST /books/new", async () => {
            const res = await request(app).post("/books/new").send({ title: "" });
            expect(res.text).toContain("New Book");
            // Stryker map'i silerse hatalar listelenmez, o yüzden mühürleme şart
            expect(res.text).toMatch(/title|author/i);
        });

        it("should kill update failure and else-throw mutants", async () => {
            const book = await Book.create({ title: "Old", author: "A" });
            
            // Validation Error Kolu
            const resVal = await request(app).post(`/books/${book.id}`).send({ title: "" });
            expect(resVal.text).toMatch(/title|author/i);

            // Generic Error Kolu (else { throw error })
            jest.spyOn(Book, "findByPk").mockResolvedValue(book);
            jest.spyOn(book, "update").mockRejectedValue(new Error("CRITICAL_UPDATE_ERROR"));
            const resErr = await request(app).post(`/books/${book.id}`).send({ title: "New" });
            expect(resErr.text).toContain("CRITICAL_UPDATE_ERROR");
        });

        it("should kill delete catch block specifically", async () => {
            const book = await Book.create({ title: "DeleteMe", author: "A" });
            jest.spyOn(Book, "findByPk").mockResolvedValue(book);
            jest.spyOn(book, "destroy").mockRejectedValue(new Error("DELETE_FAILED_DB"));
            
            const res = await request(app).post(`/books/${book.id}/delete`);
            expect(res.text).toContain("DELETE_FAILED_DB");
        });
    });

    /* --- 4. GLOBAL ERROR HANDLER FALLBACKS --- */
    describe("Error Handling Fallbacks", () => {
        it("should kill status code and message fallback mutants (|| 500 / || default)", async () => {
            const { globalError } = require("../errorHandlers");
            const renderMock = jest.fn();
            const logSpy = jest.spyOn(console, "log").mockImplementation();
            
            // err.status ve err.message'ın OLMADIĞI durum (Fallback testi)
            const emptyErr = {}; 
            globalError(emptyErr, {}, { render: renderMock }, {});

            // status || 500 kontrolü
            expect(emptyErr.status).toBe(500);
            // message || fallback kontrolü
            expect(emptyErr.message).toContain("A Server Error Occured!");
            
            expect(renderMock).toHaveBeenCalledWith("error", expect.objectContaining({ err: emptyErr }));
        });

        it("should kill 404 message literals precisely", async () => {
            const res = await request(app).get("/this-route-does-not-exist");
            expect(res.text).toContain("A 404 Error Occured!");
            expect(res.text).toContain("The webpage could not be found!");
        });
    });

    /* --- 5. APP.JS & MIDDLEWARE --- */
    describe("App Infrastructure Deep Check", () => {
        it("should kill cookie-parser and json middleware mutants", () => {
            const layers = app._router.stack.map(s => s.name);
            expect(layers).toContain("jsonParser");
            expect(layers).toContain("cookieParser");
            expect(layers).toContain("urlencodedParser");
        });

        it("should verify static path and view config", () => {
            expect(app.get("view engine")).toBe("pug");
            // Static files mühürleme
            return request(app).get("/stylesheets/style.css").expect(200);
        });
    });
});