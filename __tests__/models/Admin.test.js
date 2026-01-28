import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Admin from "../../models/Admin.js";

describe("Admin Model", () => {
  let mongoServer;

  // Vor allen Tests: In-Memory MongoDB starten
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  // Nach allen Tests: Verbindung schließen und Server stoppen
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Vor jedem Test: Datenbank leeren
  beforeEach(async () => {
    await Admin.deleteMany({});
  });

  describe("Schema Validation", () => {
    it("sollte einen Admin mit gültigen Daten erstellen", async () => {
      const adminData = {
        username: "testadmin",
        password: "testpassword123",
      };

      const admin = new Admin(adminData);
      const savedAdmin = await admin.save();

      expect(savedAdmin._id).toBeDefined();
      expect(savedAdmin.username).toBe("testadmin");
      expect(savedAdmin.password).not.toBe("testpassword123"); // Sollte gehasht sein
      expect(savedAdmin.createdAt).toBeDefined();
      expect(savedAdmin.updatedAt).toBeDefined();
    });

    it("sollte Fehler werfen wenn username fehlt", async () => {
      const admin = new Admin({ password: "testpassword" });

      await expect(admin.save()).rejects.toThrow();
    });

    it("sollte Fehler werfen wenn password fehlt", async () => {
      const admin = new Admin({ username: "testadmin" });

      await expect(admin.save()).rejects.toThrow();
    });

    it("sollte Fehler werfen bei doppeltem username", async () => {
      await Admin.create({
        username: "duplicate",
        password: "password123",
      });

      const duplicateAdmin = new Admin({
        username: "duplicate",
        password: "anotherpassword",
      });

      await expect(duplicateAdmin.save()).rejects.toThrow();
    });
  });

  describe("Password Hashing (Pre-save Hook)", () => {
    it("sollte Passwort automatisch hashen beim Speichern", async () => {
      const plainPassword = "mySecurePassword123";
      const admin = new Admin({
        username: "hashtest",
        password: plainPassword,
      });

      await admin.save();

      expect(admin.password).not.toBe(plainPassword);
      expect(admin.password.length).toBeGreaterThan(20); // Bcrypt Hash ist länger
      expect(admin.password).toMatch(/^\$2[aby]\$/); // Bcrypt Format
    });

    it("sollte Passwort nicht erneut hashen wenn es nicht geändert wurde", async () => {
      const admin = new Admin({
        username: "norehashadmin",
        password: "password123",
      });

      await admin.save();
      const firstHash = admin.password;

      // Admin erneut speichern ohne Passwort zu ändern
      admin.username = "updatedUsername";
      await admin.save();

      expect(admin.password).toBe(firstHash); // Hash sollte gleich bleiben
    });

    it("sollte Passwort neu hashen wenn es geändert wurde", async () => {
      const admin = new Admin({
        username: "rehashtest",
        password: "initialPassword",
      });

      await admin.save();
      const firstHash = admin.password;

      // Passwort ändern
      admin.password = "newPassword123";
      await admin.save();

      expect(admin.password).not.toBe(firstHash);
      expect(admin.password).toMatch(/^\$2[aby]\$/);
    });

    it("sollte mit Salt-Rounds von 12 hashen", async () => {
      const admin = new Admin({
        username: "salttest",
        password: "testPassword",
      });

      await admin.save();

      // Bcrypt Hash Format: $2a$12$... (12 = Salt Rounds)
      expect(admin.password).toMatch(/^\$2[aby]\$12\$/);
    });
  });

  describe("comparePassword Method", () => {
    it("sollte true zurückgeben bei korrektem Passwort", async () => {
      const plainPassword = "correctPassword123";
      const admin = new Admin({
        username: "comparetest",
        password: plainPassword,
      });

      await admin.save();

      const isMatch = await admin.comparePassword(plainPassword);
      expect(isMatch).toBe(true);
    });

    it("sollte false zurückgeben bei falschem Passwort", async () => {
      const admin = new Admin({
        username: "wrongpasstest",
        password: "correctPassword",
      });

      await admin.save();

      const isMatch = await admin.comparePassword("wrongPassword");
      expect(isMatch).toBe(false);
    });

    it("sollte false zurückgeben bei leerem Passwort", async () => {
      const admin = new Admin({
        username: "emptytest",
        password: "actualPassword",
      });

      await admin.save();

      const isMatch = await admin.comparePassword("");
      expect(isMatch).toBe(false);
    });

    it("sollte case-sensitive sein", async () => {
      const admin = new Admin({
        username: "casetest",
        password: "Password123",
      });

      await admin.save();

      const isMatchLower = await admin.comparePassword("password123");
      const isMatchUpper = await admin.comparePassword("PASSWORD123");
      const isMatchCorrect = await admin.comparePassword("Password123");

      expect(isMatchLower).toBe(false);
      expect(isMatchUpper).toBe(false);
      expect(isMatchCorrect).toBe(true);
    });

    it("sollte mit Sonderzeichen im Passwort umgehen", async () => {
      const specialPassword = "P@ssw0rd!#$%&*()";
      const admin = new Admin({
        username: "specialchars",
        password: specialPassword,
      });

      await admin.save();

      const isMatch = await admin.comparePassword(specialPassword);
      expect(isMatch).toBe(true);
    });

    it("sollte mit sehr langem Passwort umgehen", async () => {
      const longPassword = "a".repeat(100) + "!B1";
      const admin = new Admin({
        username: "longpass",
        password: longPassword,
      });

      await admin.save();

      const isMatch = await admin.comparePassword(longPassword);
      expect(isMatch).toBe(true);
    });
  });

  describe("Timestamps", () => {
    it("sollte createdAt und updatedAt automatisch setzen", async () => {
      const admin = new Admin({
        username: "timestamptest",
        password: "password123",
      });

      const beforeSave = new Date();
      await admin.save();
      const afterSave = new Date();

      expect(admin.createdAt).toBeDefined();
      expect(admin.updatedAt).toBeDefined();
      expect(admin.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeSave.getTime(),
      );
      expect(admin.createdAt.getTime()).toBeLessThanOrEqual(
        afterSave.getTime(),
      );
    });

    it("sollte updatedAt aktualisieren bei Änderungen", async () => {
      const admin = new Admin({
        username: "updatetest",
        password: "password123",
      });

      await admin.save();
      const firstUpdatedAt = admin.updatedAt;

      // Kleine Verzögerung
      await new Promise((resolve) => setTimeout(resolve, 10));

      admin.username = "updatedUsername";
      await admin.save();

      expect(admin.updatedAt.getTime()).toBeGreaterThan(
        firstUpdatedAt.getTime(),
      );
    });
  });
});
