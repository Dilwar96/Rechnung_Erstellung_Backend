import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import * as companyController from "../../controllers/companyController.js";
import Company from "../../models/Company.js";

describe("CompanyController", () => {
  let mongoServer;
  let req, res;

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
    await Company.deleteMany({});

    // Mock Request und Response
    req = {
      body: {},
    };

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe("getCompany", () => {
    it("sollte existierende Firma zurückgeben", async () => {
      // Company erstellen
      const company = await Company.create({
        name: "Existing Company",
        address: "123 Test St",
        city: "Berlin",
        postalCode: "10115",
        phone: "+49 30 12345678",
        email: "test@company.com",
        taxNumber: "DE123456",
        bankName: "Test Bank",
        accountNumber: "123456",
        iban: "DE123456789",
        swift: "TESTXXX",
      });

      await companyController.getCompany(req, res);

      expect(res.json).toHaveBeenCalled();
      const returnedCompany = res.json.mock.calls[0][0];
      expect(returnedCompany.name).toBe("Existing Company");
      expect(returnedCompany._id.toString()).toBe(company._id.toString());
    });

    it("sollte neue Firma erstellen wenn keine existiert", async () => {
      await companyController.getCompany(req, res);

      expect(res.json).toHaveBeenCalled();
      const returnedCompany = res.json.mock.calls[0][0];

      // Sollte mit Standardwerten erstellt werden
      expect(returnedCompany.name).toBe("Your Company Name");
      expect(returnedCompany.address).toBe("123 Business Street");
      expect(returnedCompany._id).toBeDefined();

      // Prüfen ob Company in DB gespeichert wurde
      const companies = await Company.find();
      expect(companies).toHaveLength(1);
    });

    it("sollte immer die erste Company zurückgeben", async () => {
      // Mehrere Companies erstellen (sollte in Praxis nicht vorkommen)
      await Company.create({
        name: "First Company",
        address: "Address 1",
        city: "City 1",
        postalCode: "11111",
        phone: "111",
        email: "first@test.com",
        taxNumber: "TAX1",
        bankName: "Bank1",
        accountNumber: "1",
        iban: "IBAN1",
        swift: "SWIFT1",
      });

      await Company.create({
        name: "Second Company",
        address: "Address 2",
        city: "City 2",
        postalCode: "22222",
        phone: "222",
        email: "second@test.com",
        taxNumber: "TAX2",
        bankName: "Bank2",
        accountNumber: "2",
        iban: "IBAN2",
        swift: "SWIFT2",
      });

      await companyController.getCompany(req, res);

      expect(res.json).toHaveBeenCalled();
      const returnedCompany = res.json.mock.calls[0][0];
      expect(returnedCompany.name).toBe("First Company");
    });
  });

  describe("updateCompany", () => {
    it("sollte existierende Firma aktualisieren", async () => {
      const company = await Company.create({
        name: "Old Name",
        address: "Old Address",
        city: "Old City",
        postalCode: "11111",
        phone: "111",
        email: "old@test.com",
        taxNumber: "OLDTAX",
        bankName: "Old Bank",
        accountNumber: "111",
        iban: "OLDIBAN",
        swift: "OLDSWIFT",
      });

      req.body = {
        name: "Updated Company Name",
        address: "New Address 456",
        city: "Hamburg",
        phone: "+49 40 98765432",
        email: "updated@company.de",
      };

      await companyController.updateCompany(req, res);

      expect(res.json).toHaveBeenCalled();
      const updatedCompany = res.json.mock.calls[0][0];
      expect(updatedCompany.name).toBe("Updated Company Name");
      expect(updatedCompany.address).toBe("New Address 456");
      expect(updatedCompany.city).toBe("Hamburg");

      // Prüfen ob in DB aktualisiert wurde
      const dbCompany = await Company.findById(company._id);
      expect(dbCompany.name).toBe("Updated Company Name");
    });

    it("sollte neue Firma erstellen wenn keine existiert", async () => {
      req.body = {
        name: "New Company",
        address: "New Address",
        city: "Munich",
        postalCode: "80331",
        phone: "+49 89 123456",
        email: "new@company.com",
        taxNumber: "NEWTAX",
        bankName: "New Bank",
        accountNumber: "999",
        iban: "NEWIBAN",
        swift: "NEWSWIFT",
      };

      await companyController.updateCompany(req, res);

      expect(res.json).toHaveBeenCalled();
      const newCompany = res.json.mock.calls[0][0];
      expect(newCompany.name).toBe("New Company");
      expect(newCompany.email).toBe("new@company.com");

      // Prüfen ob Company erstellt wurde
      const companies = await Company.find();
      expect(companies).toHaveLength(1);
    });

    it("sollte alle Felder aus req.body übernehmen", async () => {
      await Company.create({
        name: "Original",
        address: "Original Address",
        city: "Original City",
        postalCode: "00000",
        phone: "000",
        email: "original@test.com",
        taxNumber: "ORIG",
        bankName: "Original Bank",
        accountNumber: "000",
        iban: "ORIGIBAN",
        swift: "ORIGSWIFT",
      });

      req.body = {
        name: "Complete Update",
        owner: "Max Mustermann",
        address: "Musterstraße 123",
        city: "Frankfurt",
        postalCode: "60311",
        phone: "+49 69 123456",
        email: "info@complete.de",
        taxNumber: "DE999888777",
        bankName: "Deutsche Bank",
        accountNumber: "123456789",
        iban: "DE89370400440532013000",
        swift: "DEUTDEFF",
        logo: "base64-logo-data",
      };

      await companyController.updateCompany(req, res);

      expect(res.json).toHaveBeenCalled();
      const updated = res.json.mock.calls[0][0];
      expect(updated.name).toBe("Complete Update");
      expect(updated.owner).toBe("Max Mustermann");
      expect(updated.address).toBe("Musterstraße 123");
      expect(updated.city).toBe("Frankfurt");
      expect(updated.postalCode).toBe("60311");
      expect(updated.phone).toBe("+49 69 123456");
      expect(updated.email).toBe("info@complete.de");
      expect(updated.taxNumber).toBe("DE999888777");
      expect(updated.bankName).toBe("Deutsche Bank");
      expect(updated.accountNumber).toBe("123456789");
      expect(updated.iban).toBe("DE89370400440532013000");
      expect(updated.swift).toBe("DEUTDEFF");
      expect(updated.logo).toBe("base64-logo-data");
    });

    it("sollte leere Updates behandeln", async () => {
      const company = await Company.create({
        name: "Company Name",
        address: "Address",
        city: "City",
        postalCode: "12345",
        phone: "123",
        email: "test@test.com",
        taxNumber: "TAX",
        bankName: "Bank",
        accountNumber: "123",
        iban: "IBAN",
        swift: "SWIFT",
      });

      req.body = {}; // Leeres Update

      await companyController.updateCompany(req, res);

      expect(res.json).toHaveBeenCalled();
      const result = res.json.mock.calls[0][0];

      // Name sollte unverändert sein
      expect(result.name).toBe("Company Name");
      expect(result._id.toString()).toBe(company._id.toString());
    });

    it("sollte nur angegebene Felder aktualisieren", async () => {
      const company = await Company.create({
        name: "Original Name",
        address: "Original Address",
        city: "Original City",
        postalCode: "11111",
        phone: "Original Phone",
        email: "original@test.com",
        taxNumber: "ORIG",
        bankName: "Original Bank",
        accountNumber: "111",
        iban: "ORIGIBAN",
        swift: "ORIGSWIFT",
      });

      // Nur Name und Email aktualisieren
      req.body = {
        name: "New Name",
        email: "newemail@test.com",
      };

      await companyController.updateCompany(req, res);

      const updated = await Company.findById(company._id);
      expect(updated.name).toBe("New Name");
      expect(updated.email).toBe("newemail@test.com");
      // Andere Felder sollten unverändert sein
      expect(updated.address).toBe("Original Address");
      expect(updated.city).toBe("Original City");
      expect(updated.phone).toBe("Original Phone");
    });
  });
});
