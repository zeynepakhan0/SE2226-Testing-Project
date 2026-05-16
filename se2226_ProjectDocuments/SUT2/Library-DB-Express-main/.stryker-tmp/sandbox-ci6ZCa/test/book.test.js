// @ts-nocheck
const request = require("supertest");
const app = require("../app");
const { sequelize, Book, Sequelize } = require("../models");
const { Op } = Sequelize;

afterEach(() => {
  jest.restoreAllMocks();
});

beforeEach(async () => {
  await sequelize.sync({ force: true });
});

describe("Books API Tests", () => {
  
  it("should create a new book", async () => {
    const res = await request(app).post("/books").send({
      title: "Test Book",
      author: "Test Author"
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Test Book");
  });

  it("should get all books", async () => {
    await Book.create({ title: "List Book", author: "A" });
    const res = await request(app).get("/books");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("should not create book without title", async () => {
    const res = await request(app).post("/books").send({ author: "A" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Title and author are required");
  });

  it("should update a book fully", async () => {
    const book = await Book.create({ title: "Book", author: "A", genre: "G", year: 2000 });
    const res = await request(app)
      .put(`/books/${book.id}`)
      .send({ title: "Updated", author: "B", genre: "H", year: 2001 });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("Updated");
    expect(res.body.author).toBe("B");
    expect(res.body.genre).toBe("H");
    expect(res.body.year).toBe(2001);
  });

  it("should partially update title without affecting others", async () => {
    const book = await Book.create({ title: "T", author: "A", genre: "G", year: 2000 });
    const res = await request(app).put(`/books/${book.id}`).send({ title: "New Title" });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("New Title");
    expect(res.body.author).toBe("A");
    expect(res.body.genre).toBe("G");
  });

  it("should partially update author without affecting others", async () => {
    const book = await Book.create({ title: "T", author: "A", genre: "G", year: 2000 });
    const res = await request(app).put(`/books/${book.id}`).send({ author: "New Author" });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("T");
    expect(res.body.author).toBe("New Author");
    expect(res.body.year).toBe(2000);
  });

  it("should partially update genre without affecting others", async () => {
    const book = await Book.create({ title: "T", author: "A", genre: "G", year: 2000 });
    const res = await request(app).put(`/books/${book.id}`).send({ genre: "New Genre" });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("T");
    expect(res.body.genre).toBe("New Genre");
  });

  it("should partially update year without affecting others", async () => {
    const book = await Book.create({ title: "T", author: "A", genre: "G", year: 2000 });
    const res = await request(app).put(`/books/${book.id}`).send({ year: 2025 });
    expect(res.statusCode).toBe(200);
    expect(res.body.author).toBe("A");
    expect(res.body.year).toBe(2025);
  });

  it("should delete a book", async () => {
    const book = await Book.create({ title: "Delete Me", author: "A" });
    const res = await request(app).delete(`/books/${book.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Book deleted successfully");
  });

  it("deleted book should not exist anymore", async () => {
    const book = await Book.create({ title: "Book", author: "A" });
    await request(app).delete(`/books/${book.id}`);
    const res = await request(app).get("/books");
    const exists = res.body.find(b => b.id === book.id);
    expect(exists).toBeUndefined();
  });

  it("should search correctly", async () => {
    await Book.create({ title: "Harry Potter", author: "Rowling", genre: "Fantasy", year: 1997 });
    const res = await request(app).get("/books?search=Harry");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe("Harry Potter");
  });

  it("search should return empty array length 0", async () => {
    const res = await request(app).get("/books?search=xxxxxxx");
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it("should paginate", async () => {
    for (let i = 0; i < 10; i++) {
      await Book.create({ title: `PageBook ${i}`, author: "A" });
    }
    const page1 = await request(app).get("/books?page=1");
    const page2 = await request(app).get("/books?page=2");
    
    expect(Array.isArray(page1.body)).toBe(true);
    expect(Array.isArray(page2.body)).toBe(true);
    expect(page1.body.length).toBe(5);
    expect(page2.body.length).toBe(5);
    expect(page1.body[0].id).not.toBe(page2.body[0].id);
  });

  it("should return max 5 books per page", async () => {
    for (let i = 0; i < 10; i++) {
      await Book.create({ title: `Book ${i}`, author: "A" });
    }
    const res = await request(app).get("/books?page=1");
    expect(res.body.length).toBe(5);
  });

  it("should treat empty search as no filter", async () => {
    await Book.create({ title: "Book1", author: "A" });
    const res = await request(app).get("/books?search=");
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should default to page 1 when page is invalid", async () => {
    for (let i = 0; i < 6; i++) {
      await Book.create({ title: `Book ${i}`, author: "A" });
    }
    const res = await request(app).get("/books?page=0");
    expect(res.body.length).toBe(5);
  });

  it("search with only spaces should behave like empty search", async () => {
    await Book.create({ title: "Test Book", author: "A" });
    const res = await request(app).get("/books?search=   ");
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should return same results for undefined page", async () => {
    await Book.create({ title: "Book1", author: "A" });
    const res = await request(app).get("/books?page=");
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should return 404 for invalid route", async () => {
    const res = await request(app).get("/random");
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Route not found");
  });

  it("should return empty array when no match", async () => {
    const res = await request(app).get("/books?search=zzzzzz");
    expect(res.body).toEqual([]);
  });

  it("should return 404 when deleting non-existing book", async () => {
    const res = await request(app).delete(`/books/99999`);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Book not found");
  });

  it("should not update non-existing book", async () => {
    const res = await request(app).put(`/books/99999`).send({ title: "X", author: "Y" });
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Book not found");
  });

  it("should fail when title is empty string", async () => {
    const res = await request(app).post("/books").send({ title: "", author: "A" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Title and author are required");
  });

  it("should fail when author is empty string", async () => {
    const res = await request(app).post("/books").send({ title: "Book", author: "" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Title and author are required");
  });

  it("should return 500 if database fails on create", async () => {
    jest.spyOn(Book, "create").mockRejectedValue(new Error("fail"));
    const res = await request(app).post("/books").send({ title: "X", author: "Y" });
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe("Server error");
  });

  it("should not update with empty body", async () => {
    const book = await Book.create({ title: "Book", author: "A" });
    const res = await request(app).put(`/books/${book.id}`).send({});
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("Book");
  });

  it("should not update when fields are missing", async () => {
    const book = await Book.create({ title: "Book", author: "A" });
    const res = await request(app).put(`/books/${book.id}`).send({ title: undefined, author: undefined });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("Book");
    expect(res.body.author).toBe("A");
  });

  describe("View (Render/Redirect) Routes Tests", () => {
    it("should render new book form", async () => {
      const res = await request(app).get("/books/new");
      expect(res.statusCode).toBe(200);
      expect(res.text).toContain("New Book");
    });

    it("should create book via form and redirect", async () => {
      const res = await request(app).post("/books/new").send({
        title: "Form Book",
        author: "Form Author",
        genre: "Drama",
        year: 2023
      });
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe("/books");
    });

    it("should handle SequelizeValidationError on POST /books/new", async () => {
      const validationError = new Error();
      validationError.name = 'SequelizeValidationError';
      validationError.errors = [
        { message: 'Title is required' },
        { message: 'Author is required' }
      ];
      jest.spyOn(Book, "create").mockRejectedValue(validationError);

      const res = await request(app).post("/books/new").send({});
      expect(res.statusCode).toBe(200);
      expect(res.text).toContain("Title is required");
      expect(res.text).toContain("Author is required");
    });

    it("should render update form for existing book", async () => {
      const book = await Book.create({ title: "View Update", author: "Auth" });
      const res = await request(app).get(`/books/${book.id}`);
      expect(res.statusCode).toBe(200);
      expect(res.text).toContain("View Update");
    });

    it("should update book via form and redirect", async () => {
      const book = await Book.create({ title: "Old Title", author: "Auth" });
      const res = await request(app).post(`/books/${book.id}`).send({ title: "New Title" });
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe("/books");
    });

    it("should handle SequelizeValidationError on POST /books/:id", async () => {
      const book = await Book.create({ title: "Valid", author: "Valid" });
      
      const validationError = new Error();
      validationError.name = 'SequelizeValidationError';
      validationError.errors = [{ message: 'Invalid data' }];
      jest.spyOn(Book.prototype, "update").mockRejectedValue(validationError);

      const res = await request(app).post(`/books/${book.id}`).send({ title: "" });
      expect(res.statusCode).toBe(200);
      expect(res.text).toContain("Invalid data");
    });
  });

  describe("Advanced Pagination and Search Tests", () => {
    it("should return EXACTLY 5 books when more than 5 exist (Kill limit mutant)", async () => {
      for (let i = 0; i < 6; i++) {
        await Book.create({ title: `Limit Book ${i}`, author: "A" });
      }
      const res = await request(app).get("/books?page=1");
      expect(res.body.length).toBe(5);
    });

    it("should calculate offset correctly (Kill offset mutant)", async () => {
      for (let i = 0; i < 6; i++) {
        await Book.create({ title: `Offset Book ${i}`, author: "A" });
      }
      const res = await request(app).get("/books?page=2");
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe("Offset Book 5");
    });

    it("should search by author specifically (Kill Op.or mutant)", async () => {
      await Book.create({ title: "Random", author: "SpecificAuthor", genre: "X" });
      const res = await request(app).get("/books?search=SpecificAuthor");
      expect(res.body.length).toBe(1);
      expect(res.body[0].author).toBe("SpecificAuthor");
    });

    it("should search by genre specifically (Kill Op.or mutant)", async () => {
      await Book.create({ title: "Random", author: "Random", genre: "SpecificGenre" });
      const res = await request(app).get("/books?search=SpecificGenre");
      expect(res.body.length).toBe(1);
      expect(res.body[0].genre).toBe("SpecificGenre");
    });
  });

  describe("API Error and Edge Cases Tests", () => {
    it("should trim string inputs before creating", async () => {
      const res = await request(app).post("/books").send({
        title: "  Spaced Title  ",
        author: "  Spaced Author  "
      });
      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe("Spaced Title");
      expect(res.body.author).toBe("Spaced Author");
    });

    it("should return 500 on PUT if database fails", async () => {
      const book = await Book.create({ title: "X", author: "Y" });
      jest.spyOn(Book, "findByPk").mockRejectedValue(new Error("Database connection lost"));
      
      const res = await request(app).put(`/books/${book.id}`).send({ title: "Z" });
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Server error");
    });

    it("should return 500 on DELETE if database fails", async () => {
      const book = await Book.create({ title: "X", author: "Y" });
      jest.spyOn(Book, "findByPk").mockRejectedValue(new Error("Database connection lost"));
      
      const res = await request(app).delete(`/books/${book.id}`);
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe("Server error");
    });
  });
});