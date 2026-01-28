import { jest } from "@jest/globals";
import errorHandler from "../../middleware/errorHandler.js";

describe("Error Handler Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    // Mock console.error to avoid test output pollution
    jest.spyOn(console, "error").mockImplementation(() => {});

    jest.clearAllMocks();
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe("Mongoose Validation Error", () => {
    it("sollte 400 zurückgeben bei ValidationError", () => {
      const error = {
        name: "ValidationError",
        errors: {
          name: { message: "Name ist erforderlich" },
          email: { message: "Ungültige E-Mail" },
        },
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Validierungsfehler",
        errors: ["Name ist erforderlich", "Ungültige E-Mail"],
      });
    });

    it("sollte mehrere Validierungsfehler sammeln", () => {
      const error = {
        name: "ValidationError",
        errors: {
          field1: { message: "Fehler 1" },
          field2: { message: "Fehler 2" },
          field3: { message: "Fehler 3" },
        },
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Validierungsfehler",
        errors: ["Fehler 1", "Fehler 2", "Fehler 3"],
      });
    });
  });

  describe("Mongoose Cast Error", () => {
    it("sollte 400 zurückgeben bei CastError", () => {
      const error = {
        name: "CastError",
        message: 'Cast to ObjectId failed for value "invalid-id"',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Ungültige ID",
        error: 'Cast to ObjectId failed for value "invalid-id"',
      });
    });

    it("sollte Cast Error mit verschiedenen Werten behandeln", () => {
      const error = {
        name: "CastError",
        message: 'Cast to Number failed for value "abc"',
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Ungültige ID",
        error: 'Cast to Number failed for value "abc"',
      });
    });
  });

  describe("Mongoose Duplicate Key Error", () => {
    it("sollte 409 zurückgeben bei duplicate key error", () => {
      const error = {
        code: 11000,
        keyPattern: { email: 1 },
        message: "E11000 duplicate key error",
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: "email existiert bereits",
        field: "email",
      });
    });

    it("sollte duplicate key für verschiedene Felder behandeln", () => {
      const error = {
        code: 11000,
        keyPattern: { invoiceNumber: 1 },
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: "invoiceNumber existiert bereits",
        field: "invoiceNumber",
      });
    });

    it("sollte duplicate key mit mehreren Feldern behandeln", () => {
      const error = {
        code: 11000,
        keyPattern: { username: 1, email: 1 },
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: "username existiert bereits",
        field: "username",
      });
    });
  });

  describe("JWT Errors", () => {
    it("sollte 401 zurückgeben bei JsonWebTokenError", () => {
      const error = {
        name: "JsonWebTokenError",
        message: "jwt malformed",
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Ungültiges Token",
      });
    });

    it("sollte 401 zurückgeben bei TokenExpiredError", () => {
      const error = {
        name: "TokenExpiredError",
        message: "jwt expired",
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Token abgelaufen",
      });
    });
  });

  describe("Default Error Handling", () => {
    it("sollte 500 zurückgeben bei generischem Error", () => {
      const error = new Error("Etwas ist schiefgelaufen");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Etwas ist schiefgelaufen",
      });
    });

    it("sollte custom statusCode verwenden wenn vorhanden", () => {
      const error = new Error("Nicht gefunden");
      error.statusCode = 404;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Nicht gefunden",
      });
    });

    it('sollte "Serverfehler" als default message verwenden', () => {
      const error = {};

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Serverfehler",
      });
    });

    it("sollte stack trace im development mode einschließen", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = new Error("Test Error");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Test Error",
          stack: expect.any(String),
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("sollte stack trace NICHT im production mode einschließen", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = new Error("Test Error");

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Test Error",
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Logging", () => {
    it("sollte Error message loggen", () => {
      const error = new Error("Test Error");

      errorHandler(error, req, res, next);

      expect(console.error).toHaveBeenCalledWith("Error:", "Test Error");
    });

    it("sollte Stack trace loggen", () => {
      const error = new Error("Test Error");

      errorHandler(error, req, res, next);

      expect(console.error).toHaveBeenCalledWith("Stack:", error.stack);
    });

    it("sollte auch bei Errors ohne Message loggen", () => {
      const error = {};

      errorHandler(error, req, res, next);

      expect(console.error).toHaveBeenCalledWith("Error:", undefined);
    });
  });

  describe("Edge Cases", () => {
    it("sollte mit Error ohne name property umgehen", () => {
      const error = {
        message: "Unknown error",
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Unknown error",
      });
    });

    it("sollte mit Error ohne message property umgehen", () => {
      const error = {
        name: "CustomError",
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Serverfehler",
      });
    });

    it("sollte mit null error umgehen", () => {
      const error = null;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Serverfehler",
      });
    });

    it("sollte mit string error umgehen", () => {
      const error = "String error";

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("sollte statusCode 0 als invalid behandeln", () => {
      const error = new Error("Test");
      error.statusCode = 0;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
