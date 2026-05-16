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
  
  /* --- POST /books --- */
  it("should create a new book and trim inputs", async () => {
    const res = await request(app).post("/books").send({
      title: "  Test Book  ", 
      author: "  Test Author  "
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Test Book");
    expect(res.body.author).toBe("Test Author");
  });

  it("should return 400 if title is missing or empty", async () => {
    const res = await request(app).post("/books").send({ author: "Author Only" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  /* --- GET /books (Pagination & Search) --- */
  it("should return max 5 books and paginate correctly", async () => {
    for (let i = 1; i <= 6; i++) {
      await Book.create({ title: `Book ${i}`, author: "A" });
    }
    const res = await request(app).get("/books?page=2");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1); 
    expect(res.body[0].title).toBe("Book 6");
  });

  it("should search by title, author OR genre", async () => {
    await Book.create({ title: "Harry Potter", author: "Rowling", genre: "Fantasy" });
    await Book.create({ title: "Clean Code", author: "Uncle Bob", genre: "Tech" });

    const resTitle = await request(app).get("/books?search=Harry");
    const resAuthor = await request(app).get("/books?search=Bob");
    const resGenre = await request(app).get("/books?search=Tech");

    expect(resTitle.body[0].title).toBe("Harry Potter");
    expect(resAuthor.body[0].author).toBe("Uncle Bob");
    expect(resGenre.body[0].genre).toBe("Tech");
  });

  /* --- PUT /books/:id --- */
  it("should update all fields correctly", async () => {
    const book = await Book.create({ title: "Old", author: "Old", genre: "Old", year: 1990 });
    const res = await request(app)
      .put(`/books/${book.id}`)
      .send({ title: "New", author: "New", genre: "New", year: 2020 });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("New");
    expect(res.body.year).toBe(2020);
  });

  it("should return 404 when updating non-existing book", async () => {
    const res = await request(app).put("/books/9999").send({ title: "X", author: "Y" });
    expect(res.statusCode).toBe(404);
  });

  /* --- DELETE /books/:id --- */
  it("should delete and return 200", async () => {
    const book = await Book.create({ title: "To be deleted", author: "A" });
    const res = await request(app).delete(`/books/${book.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("success");
    
    // Silindiğini doğrula
    const check = await Book.findByPk(book.id);
    expect(check).toBeNull();
  });

  /* --- Error Handling & SpyOn (Crucial for 80%+) --- */
  it("should return 500 on database failure (Global Error Handler check)", async () => {
    // Veritabanı hatasını taklit et (SpyOn)
    jest.spyOn(Book, "findAll").mockRejectedValue(new Error("DB CRASH"));
    
    const res = await request(app).get("/books");
    expect(res.statusCode).toBe(500);
  });

  it("should return 404 for a route that does not exist", async () => {
    const res = await request(app).get("/this/route/is/fake");
    expect(res.statusCode).toBe(404);
  });

  /* --- Form Routes (Redirects) --- */
  it("POST /books/new should redirect to /books on success", async () => {
    const res = await request(app)
      .post("/books/new")
      .send({ title: "Form Book", author: "Form Author" });
    
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe("/books");
  });
});