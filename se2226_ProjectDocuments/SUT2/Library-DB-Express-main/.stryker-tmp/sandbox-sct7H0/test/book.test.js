// @ts-nocheck
const request = require("supertest");
const app = require("../app");
const { sequelize, Book } = require("../models");
const { Op } = require("sequelize");

/**
 * THE 90% ULTIMATE DESTROYER - V6 (STRICT PRODUCTION MATCH)
 * Bu dosya, uygulamanın GERÇEK çıktı metinlerine (Please Provide a Value...) göre düzenlenmiştir.
 */

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterEach(async () => {
    await Book.destroy({ where: {}, truncate: true });
    jest.restoreAllMocks();
    jest.clearAllMocks();
});

describe("The Final 90% Mutation Push - V6", () => {

    /* --- 1. ARAMA MANTIĞI VE GERÇEK METİNLER --- */
    describe("Deep Search Logic & Operator Killing", () => {
        it("should kill Op.or and 'The Search Returned No Results' string", async () => {
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
                expect(res.text).not.toContain("The Search Returned No Results");
            }
        });

        it("should kill empty search string fallback logic", async () => {
            await Book.create({ title: "VisibleBook", author: "A" });
            const res = await request(app).get("/books?search=");
            expect(res.text).toContain("VisibleBook");
        });

        it("should kill search empty state message precisely", async () => {
            const res = await request(app).get("/books?search=NothingFoundHere999");
            expect(res.text).toContain("The Search Returned No Results");
        });
    });

    /* --- 2. PAGINATION MATEMATİĞİ (OFFSET & LIMIT) --- */
    describe("Pagination Boundary & Math", () => {
        it("should kill 'limit: 5', 'page || 1' and offset mutants", async () => {
            const books = Array.from({ length: 11 }, (_, i) => ({
                title: `ZB_BOOK_${String(i + 1).padStart(2, '0')}`,
                author: "A"
            }));
            await Book.bulkCreate(books);

            // Sayfa 1 (Default)
            const res1 = await request(app).get("/books");
            expect(res1.text).toContain("ZB_BOOK_01");
            expect(res1.text).not.toContain("ZB_BOOK_06");

            // Sayfa 2 (Math: 2 * 5 - 5 = 5 offset)
            const res2 = await request(app).get("/books?page=2");
            expect(res2.text).toContain("ZB_BOOK_06");
            expect(res2.text).not.toContain("ZB_BOOK_05");
            expect(res2.text).not.toContain("ZB_BOOK_11");

            // Sayfa 3
            const res3 = await request(app).get("/books?page=3");
            expect(res3.text).toContain("ZB_BOOK_11");

            // Linklerin varlığı (Stryker link mantığını bozarsa yakalar)
            expect(res2.text).toContain("Previous");
            expect(res2.text).toContain("Next");
            expect(res2.text).toContain("page=1");
            expect(res2.text).toContain("page=3");
        });
    });

    /* --- 3. VALIDASYON VE CRUD (MESAJLAR DÜZELTİLDİ) --- */
    describe("Validation & CRUD Catch Blocks", () => {
        it("should kill error.map with ACTUAL error messages", async () => {
            const res = await request(app).post("/books/new").send({ title: "", author: "" });
            // Uygulamanın bastığı gerçek hata metinleri:
            expect(res.text).toContain("Please Provide a Value For Title");
            expect(res.text).toContain("Please Provide a Value For Author");
        });

        it("should kill update validation and database catch blocks", async () => {
            const book = await Book.create({ title: "Old", author: "A" });
            
            // Validation Fail (Update)
            const resVal = await request(app).post(`/books/${book.id}`).send({ title: "" });
            expect(resVal.text).toContain("Please Provide a Value For Title");

            // DB Crash (Catch block)
            jest.spyOn(Book, "findByPk").mockResolvedValue(book);
            jest.spyOn(book, "update").mockRejectedValue(new Error("SEQUELIZE_INTERNAL_FAIL"));
            
            const resErr = await request(app).post(`/books/${book.id}`).send({ title: "New" });
            expect(resErr.text).toContain("SEQUELIZE_INTERNAL_FAIL");
        });

        it("should kill delete functionality and catch block", async () => {
            const book = await Book.create({ title: "DeleteMe", author: "A" });
            
            // Success
            const resSucc = await request(app).post(`/books/${book.id}/delete`);
            expect(resSucc.statusCode).toBe(302);

            // Fail (Catch block)
            const book2 = await Book.create({ title: "FailMe", author: "A" });
            jest.spyOn(Book, "findByPk").mockResolvedValue(book2);
            jest.spyOn(book2, "destroy").mockRejectedValue(new Error("DELETE_CRASH"));
            
            const resFail = await request(app).post(`/books/${book2.id}/delete`);
            expect(resFail.text).toContain("DELETE_CRASH");
        });
    });

    /* --- 4. HATA YÖNETİMİ (FALLBACKS & LOGS) --- */
    describe("Error Handling Internals", () => {
        it("should kill 404 literals and error object mutants", async () => {
            const res = await request(app).get("/non-existent-route-xyz");
            // Eğer response 200 dönüyorsa render başarılı demektir, metne odaklanalım
            expect(res.text).toContain("A 404 Error Occured!");
            expect(res.text).toContain("The webpage could not be found!");
            expect(res.text).toContain("404.  Page Not Found");
        });

        it("should kill global error fallback values (|| 500)", async () => {
            const { globalError } = require("../errorHandlers");
            const renderMock = jest.fn();
            const logSpy = jest.spyOn(console, "log").mockImplementation();
            
            const emptyErr = {}; 
            globalError(emptyErr, {}, { render: renderMock }, {});

            // Fallback değerlerini mühürle
            expect(emptyErr.status).toBe(500);
            expect(emptyErr.message).toContain("A Server Error Occured!");
            expect(logSpy).toHaveBeenCalled();
        });

        it("should kill console.log format mutants", async () => {
            const logSpy = jest.spyOn(console, "log").mockImplementation();
            const { globalError } = require("../errorHandlers");
            const err = { status: 999, message: "LOG_TEST" };
            
            globalError(err, {}, { render: jest.fn() }, {});
            
            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining("999"),
                expect.stringContaining("A Server Error Occured! LOG_TEST")
            );
        });
    });

    /* --- 5. ALTYAPI (APP.JS & MIDDLEWARE) --- */
    describe("App Infrastructure Hardening", () => {
        it("should verify middleware presence (json, cookies, static)", () => {
            const layers = app._router.stack.map(s => s.name);
            expect(layers).toContain("jsonParser");
            expect(layers).toContain("cookieParser");
            expect(layers).toContain("urlencodedParser");
            expect(layers).toContain("serveStatic");
        });

        it("should kill root redirect and static css path", async () => {
            const resRedirect = await request(app).get("/");
            expect(resRedirect.statusCode).toBe(302);
            expect(resRedirect.header.location).toBe("/books");

            const resCss = await request(app).get("/stylesheets/style.css");
            expect(resCss.statusCode).toBe(200);
        });

        it("should kill view engine config mutants", () => {
            expect(app.get("view engine")).toBe("pug");
            expect(app.get("views")).toEqual(expect.stringContaining("views"));
        });
    });

    /* --- 6. ASYNC HANDLER WRAPPER --- */
    describe("AsyncHandler Forwarding", () => {
        it("should kill next(error) mutant", async () => {
            jest.spyOn(Book, "findAndCountAll").mockRejectedValue(new Error("PAGINATION_FAIL"));
            const res = await request(app).get("/books");
            expect(res.text).toContain("PAGINATION_FAIL");
        });
    });
});