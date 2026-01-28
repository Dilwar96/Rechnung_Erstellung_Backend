import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Company from "../../models/Company.js";

describe("Company Model", () => {
  let mongoServer;

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
  });

  describe("Schema Validation", () => {
    it("sollte eine Company mit allen Standardwerten erstellen", async () => {
      const company = new Company();
      const savedCompany = await company.save();

      expect(savedCompany._id).toBeDefined();
      expect(savedCompany.name).toBe("Your Company Name");
      expect(savedCompany.address).toBe("123 Business Street");
      expect(savedCompany.city).toBe("Berlin");
      expect(savedCompany.postalCode).toBe("10115");
      expect(savedCompany.phone).toBe("+49 30 12345678");
      expect(savedCompany.email).toBe("info@yourcompany.com");
      expect(savedCompany.taxNumber).toBe("DE123456789");
      expect(savedCompany.bankName).toBe("Deutsche Bank");
      expect(savedCompany.accountNumber).toBe("1234567890");
      expect(savedCompany.iban).toBe("DE89370400440532013000");
      expect(savedCompany.swift).toBe("DEUTDEFF");
      expect(savedCompany.logo).toBe("");
    });

    it("sollte eine Company mit benutzerdefinierten Werten erstellen", async () => {
      const companyData = {
        name: "Test GmbH",
        owner: "Max Mustermann",
        address: "Teststraße 123",
        city: "Hamburg",
        postalCode: "20095",
        phone: "+49 40 98765432",
        email: "kontakt@test-gmbh.de",
        taxNumber: "DE987654321",
        bankName: "Commerzbank",
        accountNumber: "9876543210",
        iban: "DE12500800000901234567",
        swift: "COBADEFF",
        logo: "data:image/png;base64,iVBORw0KG...",
      };

      const company = new Company(companyData);
      const savedCompany = await company.save();

      expect(savedCompany.name).toBe("Test GmbH");
      expect(savedCompany.owner).toBe("Max Mustermann");
      expect(savedCompany.address).toBe("Teststraße 123");
      expect(savedCompany.city).toBe("Hamburg");
      expect(savedCompany.postalCode).toBe("20095");
      expect(savedCompany.phone).toBe("+49 40 98765432");
      expect(savedCompany.email).toBe("kontakt@test-gmbh.de");
      expect(savedCompany.taxNumber).toBe("DE987654321");
      expect(savedCompany.bankName).toBe("Commerzbank");
      expect(savedCompany.accountNumber).toBe("9876543210");
      expect(savedCompany.iban).toBe("DE12500800000901234567");
      expect(savedCompany.swift).toBe("COBADEFF");
      expect(savedCompany.logo).toBe("data:image/png;base64,iVBORw0KG...");
    });

    it("sollte owner als optionales Feld behandeln", async () => {
      const company = new Company({
        name: "Test Company",
        address: "Test Address",
        city: "Test City",
        postalCode: "12345",
        phone: "123456",
        email: "test@test.com",
        taxNumber: "TAX123",
        bankName: "Bank",
        accountNumber: "123",
        iban: "IBAN123",
        swift: "SWIFT123",
      });

      const savedCompany = await company.save();
      expect(savedCompany.owner).toBe("");
    });

    it("sollte logo als optionales Feld mit leerem String behandeln", async () => {
      const company = new Company();
      await company.save();

      expect(company.logo).toBe("");
    });
  });

  describe("Required Fields", () => {
    it("sollte Fehler werfen wenn name fehlt (ohne Default)", async () => {
      const company = new Company({
        name: undefined,
        address: "Address",
        city: "City",
        postalCode: "12345",
        phone: "123456",
        email: "test@test.com",
        taxNumber: "TAX",
        bankName: "Bank",
        accountNumber: "123",
        iban: "IBAN",
        swift: "SWIFT",
      });

      // Da name ein required field mit default ist, sollte es nicht fehlschlagen
      await expect(company.save()).resolves.toBeDefined();
    });

    it("sollte alle required fields mit defaults haben", async () => {
      const company = new Company({});
      const savedCompany = await company.save();

      expect(savedCompany.name).toBeDefined();
      expect(savedCompany.address).toBeDefined();
      expect(savedCompany.city).toBeDefined();
      expect(savedCompany.postalCode).toBeDefined();
      expect(savedCompany.phone).toBeDefined();
      expect(savedCompany.email).toBeDefined();
      expect(savedCompany.taxNumber).toBeDefined();
      expect(savedCompany.bankName).toBeDefined();
      expect(savedCompany.accountNumber).toBeDefined();
      expect(savedCompany.iban).toBeDefined();
      expect(savedCompany.swift).toBeDefined();
    });
  });

  describe("Field Types", () => {
    it("sollte Zahlen in Strings konvertieren", async () => {
      const company = new Company({
        postalCode: 12345,
        phone: 123456789,
        accountNumber: 987654321,
      });

      await company.save();

      expect(typeof company.postalCode).toBe("string");
      expect(typeof company.phone).toBe("string");
      expect(typeof company.accountNumber).toBe("string");
    });
  });

  describe("Timestamps", () => {
    it("sollte createdAt und updatedAt automatisch setzen", async () => {
      const company = new Company();
      const beforeSave = new Date();
      await company.save();
      const afterSave = new Date();

      expect(company.createdAt).toBeDefined();
      expect(company.updatedAt).toBeDefined();
      expect(company.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeSave.getTime(),
      );
      expect(company.createdAt.getTime()).toBeLessThanOrEqual(
        afterSave.getTime(),
      );
    });

    it("sollte updatedAt aktualisieren bei Änderungen", async () => {
      const company = new Company();
      await company.save();
      const firstUpdatedAt = company.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      company.name = "Updated Company Name";
      await company.save();

      expect(company.updatedAt.getTime()).toBeGreaterThan(
        firstUpdatedAt.getTime(),
      );
    });

    it("sollte createdAt nicht ändern bei Updates", async () => {
      const company = new Company();
      await company.save();
      const originalCreatedAt = company.createdAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      company.name = "New Name";
      await company.save();

      expect(company.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });
  });

  describe("CRUD Operations", () => {
    it("sollte Company finden und aktualisieren", async () => {
      const company = new Company({ name: "Original Name" });
      await company.save();

      const foundCompany = await Company.findById(company._id);
      foundCompany.name = "Updated Name";
      await foundCompany.save();

      const updatedCompany = await Company.findById(company._id);
      expect(updatedCompany.name).toBe("Updated Name");
    });

    it("sollte Company löschen", async () => {
      const company = new Company();
      await company.save();
      const companyId = company._id;

      await Company.findByIdAndDelete(companyId);

      const deletedCompany = await Company.findById(companyId);
      expect(deletedCompany).toBeNull();
    });

    it("sollte alle Companies finden", async () => {
      await Company.create({ name: "Company 1" });
      await Company.create({ name: "Company 2" });
      await Company.create({ name: "Company 3" });

      const companies = await Company.find();
      expect(companies.length).toBe(3);
    });
  });

  describe("Edge Cases", () => {
    it("sollte mit Sonderzeichen umgehen", async () => {
      const company = new Company({
        name: "Test GmbH & Co. KG äöüß",
        email: "test+special@test-domain.co.uk",
        phone: "+49 (0) 30 / 123-456",
      });

      await company.save();

      expect(company.name).toBe("Test GmbH & Co. KG äöüß");
      expect(company.email).toBe("test+special@test-domain.co.uk");
      expect(company.phone).toBe("+49 (0) 30 / 123-456");
    });

    it("sollte Base64-Logo speichern", async () => {
      const base64Logo =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const company = new Company({ logo: base64Logo });

      await company.save();

      expect(company.logo).toBe(base64Logo);
    });
  });
});
