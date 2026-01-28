import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import authMiddleware from "../../middleware/auth.js";

describe("Auth Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    // Request, Response und Next mocken
    req = {
      headers: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();

    // Environment Variable setzen
    process.env.JWT_SECRET = "test-secret-key";

    // Mocks zurücksetzen
    jest.clearAllMocks();
  });

  describe("Erfolgreiche Authentifizierung", () => {
    it("sollte Token validieren und User-Daten an req anhängen", () => {
      const userPayload = {
        id: "user123",
        username: "testuser",
      };

      const token = jwt.sign(userPayload, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe("user123");
      expect(req.user.username).toBe("testuser");
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("Fehlende Authorization", () => {
    it("sollte 401 zurückgeben wenn kein Authorization Header vorhanden", () => {
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Keine Authentifizierung vorhanden. Token erforderlich.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('sollte 401 zurückgeben wenn Authorization Header nicht mit "Bearer " startet', () => {
      req.headers.authorization = "InvalidFormat token123";

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Keine Authentifizierung vorhanden. Token erforderlich.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("sollte 401 zurückgeben wenn Token leer ist", () => {
      req.headers.authorization = "Bearer ";

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Token fehlt",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('sollte 401 zurückgeben wenn nur "Bearer" ohne Space und Token', () => {
      req.headers.authorization = "Bearer";

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Keine Authentifizierung vorhanden. Token erforderlich.",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Ungültiges Token", () => {
    it("sollte 401 zurückgeben bei ungültigem Token", () => {
      req.headers.authorization = "Bearer invalid.token.here";

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Ungültiges Token",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("sollte 401 zurückgeben bei abgelaufenem Token", () => {
      // Token mit negativer Expirationzeit erstellen
      const expiredToken = jwt.sign(
        { id: "user123", username: "test" },
        process.env.JWT_SECRET,
        { expiresIn: "-1h" },
      );

      req.headers.authorization = `Bearer ${expiredToken}`;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Token ist abgelaufen. Bitte erneut anmelden.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("sollte 401 zurückgeben bei Token mit falschem Secret", () => {
      const tokenWithWrongSecret = jwt.sign(
        { id: "user123", username: "test" },
        "wrong-secret",
        { expiresIn: "1d" },
      );

      req.headers.authorization = `Bearer ${tokenWithWrongSecret}`;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Ungültiges Token",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("sollte 401 zurückgeben bei manipuliertem Token", () => {
      const validToken = jwt.sign(
        { id: "user123", username: "test" },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
      );

      // Token manipulieren
      const manipulatedToken = validToken.slice(0, -5) + "xxxxx";
      req.headers.authorization = `Bearer ${manipulatedToken}`;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("sollte mit mehreren Spaces nach Bearer umgehen", () => {
      const token = jwt.sign(
        { id: "user123", username: "test" },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
      );

      req.headers.authorization = `Bearer    ${token}`;

      authMiddleware(req, res, next);

      // Sollte fehlschlagen da split(' ')[1] leer wäre
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("sollte mit Token ohne Expiration umgehen", () => {
      const token = jwt.sign(
        { id: "user123", username: "test" },
        process.env.JWT_SECRET,
        // Kein expiresIn
      );

      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(req.user.id).toBe("user123");
      expect(next).toHaveBeenCalled();
    });
  });
});
