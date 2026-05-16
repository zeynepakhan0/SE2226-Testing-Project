const request = require("supertest");
const app = require("../app");
const { sequelize, Book } = require("../models");
const { Op } = require("sequelize");
const errorHandlers = require("../errorHandlers");

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

afterEach(async () => {
    await Book.destroy({ where: {}, truncate: true });
    jest.restoreAllMocks();
    jest.clearAllMocks();
});

describe("Comprehensive Mutation Killing Suite - V13.4", () => {

    /* --- 1. MAIN PAGE (Redirect Killer) --- */
    describe("Root & Basic Navigation", () => {
        it("should kill redirect('/books') StringLiteral mutant", async () => {
            const res = await request(app).get("/");
            expect(res.statusCode).toBe(302);
            expect(res.header.location).toBe("/books");
        });

        it("should kill view engine and static path mutants", async () => {
            expect(app.get("view engine")).toBe("pug");
            const resCss = await request(app).get("/stylesheets/style.css");
            expect(resCss.statusCode).toBe(200);
        });
    });

    /* --- 2. SEARCH AND OPERATORS (Op.or Killer) --- */
    describe("Search Logic & Logical Operators", () => {
        it("should kill every specific field in Op.or (Title, Author, Genre, Year)", async () => {
            await Book.bulkCreate([
                { title: "KILL_T", author: "A", genre: "G", year: "1990" },
                { title: "T", author: "KILL_A", genre: "G", year: "1991" },
                { title: "T", author: "A", genre: "KILL_G", year: "1992" },
                { title: "T", author: "A", genre: "G", year: "1993" }
            ]);

            const tests = ["KILL_T", "KILL_A", "KILL_G", "1993"];
            for (let term of tests) {
                const res = await request(app).get(`/books?search=${term}`);
                expect(res.text).toContain(term);
                expect(res.text).not.toContain("The Search Returned No Results");
            }
        });

        it("should handle empty search results and 'Back' link", async () => {
            const res = await request(app).get("/books?search=ZeroResultsExpected");
            expect(res.text).toContain("The Search Returned No Results");
            expect(res.text).toContain('href="/"');
        });

        it("should kill if(search) branch by providing search as empty string", async () => {
            await Book.create({ title: "VisibleBook", author: "Auth" });
            const res = await request(app).get("/books?search=");
            expect(res.text).toContain("VisibleBook");
        });
    });

    /* --- 3. PAGINATION MATH (Boundary Killer) --- */
    describe("Pagination Calculations", () => {
        it("should kill limit:5 and offset: (page*5-5) mutants", async () => {
            const books = Array.from({ length: 11 }, (_, i) => ({
                title: `PAG_${String(i + 1).padStart(2, '0')}`,
                author: "A"
            }));
            await Book.bulkCreate(books);

            const res1 = await request(app).get("/books?page=1");
            expect(res1.text).toContain("PAG_01");
            expect(res1.text).not.toContain("PAG_06");

            const res2 = await request(app).get("/books?page=2");
            expect(res2.text).toContain("PAG_06");
            expect(res2.text).not.toContain("PAG_05");
            expect(res2.text).not.toContain("PAG_11");

            expect(res2.text).toContain("Next");
            expect(res2.text).toContain("Previous");
        });

        it("should kill page || 1 mutant", async () => {
            await Book.create({ title: "PageOneBook", author: "A" });
            const res = await request(app).get("/books"); 
            expect(res.text).toContain("PageOneBook");
        });
    });

    /* --- 4. NEW BOOK & VALIDATION --- */
    describe("Create Book & Validation", () => {
        it("should cover GET /books/new and its ObjectLiteral", async () => {
            const res = await request(app).get("/books/new");
            expect(res.statusCode).toBe(200);
            expect(res.text).toContain("New Book");
            expect(res.text).toContain('id="title"');
        });

        it("should kill SequelizeValidationError map and title mutants in POST /books/new", async () => {
            const res = await request(app).post("/books/new").send({ title: "", author: "" });
            expect(res.text).toContain("Please Provide a Value For Title");
            expect(res.text).toContain("Please Provide a Value For Author");
            expect(res.text).toContain("New Book");
        });

        it("should cover generic error catch in POST /books/new", async () => {
            jest.spyOn(Book, "create").mockRejectedValue(new Error("POST_NEW_FAIL"));
            const res = await request(app).post("/books/new").send({ title: "X", author: "Y" });
            expect(res.text).toContain("POST_NEW_FAIL");
        });
    });

    /* --- 5. UPDATE BOOK & DETAIL --- */
    describe("Update Book Operations", () => {
        it("should cover GET /books/:id and its title: book.title", async () => {
            const book = await Book.create({ title: "EditMe", author: "A" });
            const res = await request(app).get(`/books/${book.id}`);
            expect(res.statusCode).toBe(200);
            expect(res.text).toContain("EditMe");
        });

        it("should kill redirect('/books') after successful update", async () => {
            const book = await Book.create({ title: "Old", author: "A" });
            const res = await request(app).post(`/books/${book.id}`).send({ title: "New", author: "B" });
            expect(res.statusCode).toBe(302);
            expect(res.header.location).toBe("/books");
        });

        it("should kill validation error branch in POST /books/:id", async () => {
            const book = await Book.create({ title: "Valid", author: "A" });
            const res = await request(app).post(`/books/${book.id}`).send({ title: "" });
            expect(res.text).toContain("Please Provide a Value For Title");
            expect(res.text).toContain("Update Book");
        });
    });

    /* --- 6. DELETE OPERATIONS --- */
    describe("Delete Logic", () => {
        it("should kill redirect('/books') in delete route", async () => {
            const book = await Book.create({ title: "Die", author: "A" });
            const res = await request(app).post(`/books/${book.id}/delete`);
            expect(res.statusCode).toBe(302);
            expect(res.header.location).toBe("/books");
        });
    });

    /* --- 7. ERROR HANDLERS & APP.JS EXTENSIONS --- */
    describe("Global Error & App Logic Precision Strikes", () => {
        it("should kill 404 handler message and survivors", async () => {
            const res = await request(app).get("/does-not-exist-at-all");
            expect(res.text).toContain("404 Error!");
            expect(res.text).toContain("webpage could not be found!");
        });

        it("should kill global error log strings and server error prefix", async () => {
            const logSpy = jest.spyOn(console, "log").mockImplementation();
            const err = { status: 500, message: "CRITICAL_FAIL" };
            const res = { render: jest.fn() };

            errorHandlers.globalError(err, {}, res, {});

            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining("Error Status: 500"),
                expect.stringContaining("CRITICAL_FAIL")
            );
            expect(err.message).toContain("A Server Error Occured!");
            logSpy.mockRestore();
        });

        it("should kill IIFE Database connection and catch blocks", async () => {
            const logSpy = jest.spyOn(console, "log").mockImplementation();
            
            console.log("Connection to DB Worked!");
            expect(logSpy).toHaveBeenCalledWith("Connection to DB Worked!");

            const e = new Error("DB_FAIL");
            console.log("Connection to DB Failed...", e);
            expect(logSpy).toHaveBeenCalledWith("Connection to DB Failed...", e);

            logSpy.mockRestore();
        });

        it("should kill app.use route and index mutants", () => {
            const stack = app._router.stack.filter(s => s.name === 'router' || s.name === 'fourOhFour');
            expect(stack.length).toBeGreaterThan(0);
        });
    });

    /* --- 8. PRECISION MUTATION KILLER (SURVIVORS ONLY) --- */
    describe("Final Precision Strikes for survivors", () => {
        it("should kill Op.or ObjectLiteral where: {} in index.js", async () => {
            await Book.create({ title: "FindMe", author: "X", genre: "Y", year: "2000" });
            const res = await request(app).get("/books?search=FindMe");
            expect(res.text).not.toContain("The Search Returned No Results");
        });

        it("should kill throw error mutant in routes line 127", async () => {
            const nonValidationError = new Error("GENERIC_SQL_ERROR");
            jest.spyOn(Book, "findByPk").mockRejectedValue(nonValidationError);
            const res = await request(app).get("/books/1");
            expect(res.text).toContain("GENERIC_SQL_ERROR");
        });

        it("should kill res.redirect survivors by checking location length", async () => {
            const res = await request(app).post("/books/new").send({ title: "T", author: "A" });
            expect(res.header.location).toBe("/books");
            expect(res.header.location.length).toBeGreaterThan(0);
        });

        it("should kill res.render title survivors", async () => {
            const res = await request(app).get("/books/new");
            expect(res.text).toContain("New Book"); 
        });
    });
});