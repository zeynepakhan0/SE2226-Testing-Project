// @ts-nocheck
const request = require("supertest");
const app = require("../app");
const { sequelize, Book } = require("../models");
const { Op } = require("sequelize");

/**
 * THE 90% ULTIMATE DESTROYER - V5 (THE TOTAL SEAL)
 * Bu dosya 200+ satırdır ve Stryker'ın tüm mantıksal açıklarını kapatır.
 */

beforeAll(async () => {
    // Database'i temizle ve mühürle
    await sequelize.sync({ force: true });
});

afterEach(async () => {
    await Book.destroy({ where: {}, truncate: true });
    jest.restoreAllMocks();
    jest.clearAllMocks();
});

describe("The Final 90% Mutation Push - Ultra Edition", () => {

    /* --- 1. SEARCH LOGIC & TEXTUAL BOUNDARIES --- */
    describe("Deep Search Logic & Operator Killing", () => {
        it("should kill every single Op.or field and the 'The Search Returned No Results' string", async () => {
            // Her alan için ayrı bir kitap oluşturarak Op.or'un her dalını test et
            await Book.bulkCreate([
                { title: "FIND_TITLE", author: "A1", genre: "G1", year: "2000" },
                { title: "T1", author: "FIND_AUTHOR", genre: "G1", year: "2001" },
                { title: "T1", author: "A1", genre: "FIND_GENRE", year: "2002" },
                { title: "T1", author: "A1", genre: "G1", year: "3030" }
            ]);

            const targets = ["FIND_TITLE", "FIND_AUTHOR", "FIND_GENRE", "3030"];
            for (let term of targets) {
                const res = await request(app).get(`/books?search=${term}`);
                expect(res.text).toContain(term);
                // Stryker "if(search)" kısmını silerse veya true yaparsa bu mesaj çıkmaz
                expect(res.text).not.toContain("The Search Returned No Results");
            }
        });

        it("should kill 'The Search Returned No Results' literal precisely", async () => {
            const res = await request(app).get("/books?search=NonExistent12345");
            expect(res.text).toContain("The Search Returned No Results");
            expect(res.text).toContain("Back to the \"Books\" Page");
        });

        it("should kill empty search string mutants and check fallback", async () => {
            await Book.create({ title: "AnyBook", author: "A" });
            const res = await request(app).get("/books?search=");
            // search null/empty olduğunda tüm kitaplar gelmeli
            expect(res.text).toContain("AnyBook");
        });
    });

    /* --- 2. PAGINATION ARITHMETIC & LIMIT MAPPING --- */
    describe("Pagination & Boundary Mathematics", () => {
        it("should kill 'limit: 5', 'page || 1' and 'offset' mutants", async () => {
            // Tam 11 kitap: 1. sayfa (1-5), 2. sayfa (6-10), 3. sayfa (11)
            const books = Array.from({ length: 11 }, (_, i) => ({
                title: `Book_${String(i + 1).padStart(2, '0')}`,
                author: "A"
            }));
            await Book.bulkCreate(books);

            // 1. Sayfa (page parametresi YOKKEN - Default 1 testi)
            const res1 = await request(app).get("/books");
            expect(res1.text).toContain("Book_01");
            expect(res1.text).not.toContain("Book_06");

            // 2. Sayfa (page=2 - Matematik testi)
            const res2 = await request(app).get("/books?page=2");
            expect(res2.text).toContain("Book_06");
            expect(res2.text).toContain("Book_10");
            expect(res2.text).not.toContain("Book_05");
            expect(res2.text).not.toContain("Book_11");

            // 3. Sayfa (Sınır testi)
            const res3 = await request(app).get("/books?page=3");
            expect(res3.text).toContain("Book_11");
            
            // Linklerin doğrulanması (Boolean mutantları için)
            expect(res2.text).toContain("Previous");
            expect(res2.text).toContain("Next");
        });
    });

    /* --- 3. CRUD & SEQUELIZE VALIDATION KILLER --- */
    describe("CRUD & Validation Mapping", () => {
        it("should kill error.map in POST /books/new with specific error strings", async () => {
            const res = await request(app).post("/books/new").send({ title: "", author: "" });
            expect(res.text).toContain("New Book");
            // Stryker map'i silerse hatalar boş gelir. Bu kontrol şart:
            expect(res.text).toContain("title is required");
            expect(res.text).toContain("author is required");
        });

        it("should kill update validation and catch-all error blocks", async () => {
            const book = await Book.create({ title: "Old", author: "Old" });
            
            // 1. Validation Fail (Update)
            const resVal = await request(app).post(`/books/${book.id}`).send({ title: "" });
            expect(resVal.text).toContain("title is required");

            // 2. Database Throw Fail (Catch block)
            jest.spyOn(Book, "findByPk").mockResolvedValue(book);
            const error = new Error("SEQUELIZE_CRASH");
            error.name = "SequelizeDatabaseError";
            jest.spyOn(book, "update").mockRejectedValue(error);
            
            const resErr = await request(app).post(`/books/${book.id}`).send({ title: "New" });
            expect(resErr.text).toContain("SEQUELIZE_CRASH");
        });

        it("should kill Delete functionality and its catch block", async () => {
            const book = await Book.create({ title: "To Die", author: "A" });
            
            // Success redirect test
            const resSucc = await request(app).post(`/books/${book.id}/delete`);
            expect(resSucc.statusCode).toBe(302);

            // Catch block test
            const book2 = await Book.create({ title: "To Die 2", author: "A" });
            jest.spyOn(Book, "findByPk").mockResolvedValue(book2);
            jest.spyOn(book2, "destroy").mockRejectedValue(new Error("DELETE_FORBIDDEN"));
            
            const resFail = await request(app).post(`/books/${book2.id}/delete`);
            expect(resFail.text).toContain("DELETE_FORBIDDEN");
        });
    });

    /* --- 4. ERROR HANDLERS & FALLBACKS (CRITICAL) --- */
    describe("Error Handler Deep Internals", () => {
        it("should kill 404 message literals and status mapping", async () => {
            const res = await request(app).get("/very-wrong-url-123");
            expect(res.statusCode).toBe(404);
            expect(res.text).toContain("A 404 Error Occured!");
            expect(res.text).toContain("404.  Page Not Found");
        });

        it("should kill Global Error Fallbacks (|| 500 and || default message)", async () => {
            const { globalError } = require("../errorHandlers");
            const renderMock = jest.fn();
            const logSpy = jest.spyOn(console, "log").mockImplementation();
            
            // Boş hata objesi göndererek "|| 500" ve "|| A Server Error Occurred!" kısımlarını mühürle
            const emptyErr = {}; 
            globalError(emptyErr, {}, { render: renderMock }, {});

            expect(emptyErr.status).toBe(500);
            expect(emptyErr.message).toContain("A Server Error Occured!");
            expect(logSpy).toHaveBeenCalled();
        });

        it("should kill console.log string construction in error handler", async () => {
            const logSpy = jest.spyOn(console, "log").mockImplementation();
            const { globalError } = require("../errorHandlers");
            const complexErr = { status: 501, message: "Custom_Internal_Error" };
            
            globalError(complexErr, {}, { render: jest.fn() }, {});
            
            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining("501"),
                expect.stringContaining("A Server Error Occured! Custom_Internal_Error")
            );
        });
    });

    /* --- 5. INFRASTRUCTURE & APP.JS HARDENING --- */
    describe("App Infrastructure & Middleware", () => {
        it("should kill express.json and cookieParser presence", () => {
            const layers = app._router.stack.map(s => s.name);
            expect(layers).toContain("jsonParser");
            expect(layers).toContain("cookieParser");
            expect(layers).toContain("urlencodedParser");
            expect(layers).toContain("serveStatic");
        });

        it("should kill root redirect logic and status", async () => {
            const res = await request(app).get("/");
            expect(res.statusCode).toBe(302);
            expect(res.header.location).toBe("/books");
        });

        it("should kill pug view engine and views directory configuration", () => {
            expect(app.get("view engine")).toBe("pug");
            expect(app.get("views")).toEqual(expect.stringContaining("views"));
        });

        it("should kill static css path", async () => {
            const res = await request(app).get("/stylesheets/style.css");
            expect(res.statusCode).toBe(200);
        });
    });

    /* --- 6. ASYNC HANDLER WRAPPER TEST --- */
    describe("AsyncHandler Forwarding", () => {
        it("should kill next(error) call in asyncHandler", async () => {
            // routes/index.js içindeki herhangi bir route'u patlatarak asyncHandler'ın next'e pasladığını doğrula
            jest.spyOn(Book, "findAll").mockRejectedValue(new Error("ASYNC_FAIL"));
            const res = await request(app).get("/books");
            expect(res.text).toContain("ASYNC_FAIL");
        });
    });
});