import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import * as adminController from "../../controllers/adminController.js";
import Admin from "../../models/Admin.js";

describe("AdminController", () => {
  let mongoServer;
  let req, res, next;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Admin.deleteMany({});

    // Mock Request und Response
    req = {
      body: {},
      user: { id: "testUserId" },
    };

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    next = jest.fn();

    // Environment Variable für JWT_SECRET
    process.env.JWT_SECRET = "test-secret-key";

    jest.clearAllMocks();
  });

  describe("login", () => {
    it("sollte erfolgreich einloggen mit gültigen Credentials", async () => {
      // Admin erstellen
      await Admin.create({
        username: "admin",
        password: "password123",
      });

      req.body = {
        username: "admin",
        password: "password123",
      };

      await adminController.login(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.token).toBeDefined();
      expect(response.username).toBe("admin");
    });

    it("sollte 401 zurückgeben wenn Benutzer nicht gefunden", async () => {
      req.body = {
        username: "nonexistent",
        password: "password123",
      };

      await adminController.login(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Ungültiger Benutzername oder Passwort");
    });

    it("sollte 401 zurückgeben bei falschem Passwort", async () => {
      await Admin.create({
        username: "admin",
        password: "correctPassword",
      });

      req.body = {
        username: "admin",
        password: "wrongpassword",
      };

      await adminController.login(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Ungültiger Benutzername oder Passwort");
    });

    it("sollte Token mit korrekter Payload erstellen", async () => {
      const admin = await Admin.create({
        username: "testadmin",
        password: "testpass123",
      });

      req.body = {
        username: "testadmin",
        password: "testpass123",
      };

      await adminController.login(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];

      // Token dekodieren (ohne Verifikation für Tests)
      const tokenParts = response.token.split(".");
      const payload = JSON.parse(
        Buffer.from(tokenParts[1], "base64").toString(),
      );

      expect(payload.username).toBe("testadmin");
      expect(payload.id).toBe(admin._id.toString());
    });
  });

  describe("changeCredentials", () => {
    let testAdmin;

    beforeEach(async () => {
      testAdmin = await Admin.create({
        username: "originalUser",
        password: "originalPassword123",
      });

      req.user = { id: testAdmin._id.toString() };
    });

    it("sollte Benutzername und Passwort erfolgreich ändern", async () => {
      req.body = {
        oldPassword: "originalPassword123",
        newUsername: "updatedUser",
        newPassword: "newPassword456",
      };

      await adminController.changeCredentials(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Anmeldedaten aktualisiert",
      });

      // Prüfen ob Änderungen gespeichert wurden
      const updatedAdmin = await Admin.findById(testAdmin._id);
      expect(updatedAdmin.username).toBe("updatedUser");

      // Prüfen ob neues Passwort funktioniert
      const isPasswordCorrect =
        await updatedAdmin.comparePassword("newPassword456");
      expect(isPasswordCorrect).toBe(true);
    });

    it("sollte nur Benutzername ändern wenn kein neues Passwort angegeben", async () => {
      req.body = {
        oldPassword: "originalPassword123",
        newUsername: "newUsername",
      };

      await adminController.changeCredentials(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Anmeldedaten aktualisiert",
      });

      const updatedAdmin = await Admin.findById(testAdmin._id);
      expect(updatedAdmin.username).toBe("newUsername");

      // Altes Passwort sollte noch funktionieren
      const isPasswordCorrect = await updatedAdmin.comparePassword(
        "originalPassword123",
      );
      expect(isPasswordCorrect).toBe(true);
    });

    it("sollte nur Passwort ändern wenn kein neuer Benutzername angegeben", async () => {
      req.body = {
        oldPassword: "originalPassword123",
        newPassword: "brandNewPassword",
      };

      await adminController.changeCredentials(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Anmeldedaten aktualisiert",
      });

      const updatedAdmin = await Admin.findById(testAdmin._id);
      expect(updatedAdmin.username).toBe("originalUser");

      // Neues Passwort sollte funktionieren
      const isPasswordCorrect =
        await updatedAdmin.comparePassword("brandNewPassword");
      expect(isPasswordCorrect).toBe(true);
    });

    it("sollte 404 zurückgeben wenn Admin nicht gefunden", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      req.user = { id: fakeId.toString() };

      req.body = {
        oldPassword: "password",
        newUsername: "newUser",
      };

      await adminController.changeCredentials(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Admin nicht gefunden");
    });

    it("sollte 401 zurückgeben bei falschem altem Passwort", async () => {
      req.body = {
        oldPassword: "wrongOldPassword",
        newPassword: "newPassword",
      };

      await adminController.changeCredentials(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Altes Passwort ist falsch");

      // Prüfen dass nichts geändert wurde
      const unchangedAdmin = await Admin.findById(testAdmin._id);
      expect(unchangedAdmin.username).toBe("originalUser");
    });

    it("sollte nichts ändern wenn nur altes Passwort angegeben", async () => {
      req.body = {
        oldPassword: "originalPassword123",
      };

      await adminController.changeCredentials(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Anmeldedaten aktualisiert",
      });

      const unchangedAdmin = await Admin.findById(testAdmin._id);
      expect(unchangedAdmin.username).toBe("originalUser");
    });
  });
});
