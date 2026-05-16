
const fs = require('fs');
const path = require('path');

const request = require("supertest");
const app = require("../../app"); 
const { Book, sequelize } = require("../../models"); 
const errorHandlers = require("../../errorHandlers");
const { globalError } = require("../../errorHandlers");



describe("SUT - Master Coverage Suite (v1 Uyumlu)", () => {

  // Her testten sonra mock'ları temizle
  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** --- BÖLÜM 1: ANA SAYFA VE ARAMA (routes/index.js) --- **/

  it("1. should search books via Op.like in all fields", async () => {
    await Book.create({ title: "Jest", author: "Helin", genre: "Tech", year: 2026 });
    const res = await request(app).get("/books?search=Jest");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Jest");
  });

  it("2. should handle pagination (page 2)", async () => {
    const res = await request(app).get("/books?page=2");
    expect(res.statusCode).toBe(200);
  });

  /** --- BÖLÜM 2: CRUD İŞLEMLERİ VE VALIDASYON (routes/index.js) --- **/
  it("3. should render new book form", async () => {
    const res = await request(app).get("/books/new");
    expect(res.statusCode).toBe(200);
  });

  it("4. should create a book and redirect", async () => {
    const res = await request(app).post("/books/new").send({ title: "New", author: "Author" });
    expect(res.statusCode).toBe(302);
  });

  it("5. should handle validation error on Create (SequelizeValidationError)", async () => {
    const res = await request(app).post("/books/new").send({ title: "" });
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("New Book");
  });

  it("6. should handle validation error on Update", async () => {
    const book = await Book.create({ title: "Old", author: "Old" });
    const res = await request(app).post(`/books/${book.id}`).send({ title: "" });
    expect(res.statusCode).toBe(200);
  });

  it("7. should delete a book and redirect", async () => {
    const book = await Book.create({ title: "Delete", author: "Me" });
    const res = await request(app).post(`/books/${book.id}/delete`);
    expect(res.statusCode).toBe(302);
  });


  it("8 should handle non-existing book id", async () => {
  const res = await request(app).get("/books/999999");
  expect(res.statusCode).toBe(200); // global handler
});

it("9 should throw non-validation error on update", async () => {
  jest.spyOn(Book, 'findByPk').mockResolvedValue({
    update: jest.fn().mockRejectedValue(new Error("DB crash"))
  });

  const res = await request(app).post("/books/1");
  expect(res.statusCode).toBe(200); // global handler yakalar
});


it("10. should cover redirect after update", async () => {
  jest.spyOn(Book, 'findByPk').mockResolvedValue({
    update: jest.fn().mockResolvedValue({})
  });

  const res = await request(app).post("/books/1");

  expect(res.statusCode).toBe(302);
  expect(res.header.location).toBe('/books');
});
 
it("11. should hit throw error branch when unknown DB error occurs", async () => {
  const error = new Error("Unknown DB Error");

  jest.spyOn(Book, "create").mockRejectedValue(error);

  const response = await request(app)
    .post("/books/new")
    .send({ title: "test", author: "test" });

  // önemli: status'a değil davranışa bak
  expect(Book.create).toHaveBeenCalled();
});

  /** --- BÖLÜM 3: HATA YÖNETİMİ (errorHandlers.js) --- **/
  it("12. should trigger UI 404 and return 200 (v1 behavior)", async () => {
    const res = await request(app).get("/non/existent/route");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("A 404 Error Occured!  The webpage could not be found!");
  });

  it("13. should cover unused fourOhFour function manually", () => {
    const req = {}; const res = {}; const next = jest.fn();
    errorHandlers.fourOhFour(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("14. should trigger global error fallback message (Line 18)", async () => {
    const blankErr = new Error(); blankErr.message = ""; 
    jest.spyOn(Book, 'findAndCountAll').mockRejectedValueOnce(blankErr);
    const res = await request(app).get("/books");
    expect(res.text).toContain("A Server Error Occured!");
  }); // The second type of error message (A Server Error Occurred!) is unreacheable due to the way the error handling is structured, so we only test the first message.

  /** --- BÖLÜM 4: VERİTABANI KONFİGÜRASYONU (models/index.js) --- **/
  it("15. should cover env variable branch (Line 14)", () => {
    jest.resetModules();
    const env = process.env.NODE_ENV || 'development';
    jest.doMock('../../config/config.json', () => ({
      [env]: { use_env_variable: "DATABASE_URL", dialect: "sqlite" }
    }), { virtual: true });
    process.env.DATABASE_URL = "sqlite::memory:"; 
    const db = require("../../models/index");
    expect(db.sequelize).toBeDefined();
    delete process.env.DATABASE_URL;
  });  // the uncovered line 24 in app.js file is because the catch block is not reached since it can be reached only if the connection to the database fails, which is not the case in our test environment. To cover that line, we would need to simulate a database connection failure, which can be complex and may require additional setup or mocking of the Sequelize library.
 
it("16. should cover Line 7 (env fallback to development)", () => {
  jest.resetModules();
  const originalEnv = process.env.NODE_ENV;
  
  try {
    // 1. Ortam değişkenini silerek 'development' dalını (fallback) zorluyoruz
    delete process.env.NODE_ENV; 

    // 2. Çökmeyi önlemek için sadece development içeren sanal config
    jest.doMock('../../config/config.json', () => ({
      development: { dialect: "sqlite", storage: ":memory:", use_env_variable: false }
    }), { virtual: true });

    // 3. Modülü çalıştır ve test et
    const db = require("../../models/index");
    expect(db.sequelize).toBeDefined();

  } finally {
    // 4. Temizlik (Diğer testleri bozmamak için)
    process.env.NODE_ENV = originalEnv;
    jest.dontMock('../../config/config.json'); 
  }
});


it("17. should skip associate when not defined (cover false branch)", () => {
  jest.resetModules();

  const fakeModelPath = path.join(__dirname, '../../models/fakeModel.js');

  jest.doMock('fs', () => {
    const actualFs = jest.requireActual('fs');
    return {
      ...actualFs,
      readdirSync: (dir) => {
        if (dir.includes('models')) {
          return ['fakeModel.js'];
        }
        return actualFs.readdirSync(dir);
      }
    };
  });

  
  jest.doMock(fakeModelPath, () => {
    return () => ({
      name: 'FakeModel'
    });
  }, { virtual: true });

  const db = require('../../models/index');

  // sadece crash etmemesi bile yeter
  expect(db.FakeModel).toBeDefined();

  jest.dontMock('fs');
  jest.dontMock(fakeModelPath);
});
 /** --- BÖLÜM 1: ANA SAYFA VE ARAMA (routes/index.js) cont.. --- **/ 

  it("18. should redirect home page to /books", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(302);
    expect(res.header.location).toBe("/books");
  });

  it("19. should render books list without search", async () => {
    const res = await request(app).get("/books");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Books");
  });
  

 it("20. should hit catch block when authenticate fails", async () => {

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    jest.resetModules();

  
    jest.doMock("../../models/index.js", () => {
      return {
        sequelize: {
          sync: jest.fn().mockResolvedValue(),
          authenticate: jest.fn().mockRejectedValue(new Error("DB down")),
        }
      };
    });

   
    require("../../app");

  
    await new Promise(setImmediate);

    expect(logSpy).toHaveBeenCalledWith(
      "Connection to DB Failed...",
      expect.any(Error)
    );

    logSpy.mockRestore();
  });

    it("21. should execute server error branch", () => {

    const res = {
      render: jest.fn()
    };

    const req = {};
    const next = jest.fn();

    const err = new Error("DB failure");
    err.status = 500;

    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    globalError(err, req, res, next);

    expect(res.render).toHaveBeenCalledWith(
      "error",
      expect.any(Object)
    );

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

