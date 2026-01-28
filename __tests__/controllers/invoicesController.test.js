import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import * as invoicesController from "../../controllers/invoicesController.js";
import Invoice from "../../models/Invoice.js";
import Company from "../../models/Company.js";

describe("InvoicesController", () => {
  let mongoServer;
  let testCompany;
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
    await Invoice.deleteMany({});
    await Company.deleteMany({});

    // Test-Company erstellen
    testCompany = await Company.create({
      name: "Test Company",
      address: "Test Address",
      city: "Test City",
      postalCode: "12345",
      phone: "123456",
      email: "test@test.com",
      taxNumber: "TAX123",
      bankName: "Test Bank",
      accountNumber: "123",
      iban: "IBAN123",
      swift: "SWIFT123",
    });

    // Mock Request und Response
    req = {
      params: {},
      body: {},
      user: { id: "testUserId" },
    };

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("sollte alle Rechnungen zurückgeben", async () => {
      // Test-Rechnungen erstellen
      await Invoice.create({
        invoiceNumber: "INV-001",
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "Customer 1",
          address: "Address 1",
          city: "City 1",
          postalCode: "11111",
        },
        totals: { total: 100 },
      });

      await Invoice.create({
        invoiceNumber: "INV-002",
        date: "2026-01-29",
        company: testCompany._id,
        customer: {
          name: "Customer 2",
          address: "Address 2",
          city: "City 2",
          postalCode: "22222",
        },
        totals: { total: 200 },
      });

      await invoicesController.getAll(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const invoices = res.json.mock.calls[0][0];
      expect(invoices).toHaveLength(2);
      expect(invoices[0].invoiceNumber).toBe("INV-002"); // Neueste zuerst
      expect(invoices[1].invoiceNumber).toBe("INV-001");
    });

    it("sollte leeres Array zurückgeben wenn keine Rechnungen existieren", async () => {
      await invoicesController.getAll(req, res, next);

      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe("getById", () => {
    it("sollte eine Rechnung nach ID zurückgeben", async () => {
      const invoice = await Invoice.create({
        invoiceNumber: "INV-GET-001",
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "Test Customer",
          address: "Test Address",
          city: "Test City",
          postalCode: "12345",
        },
        totals: { total: 100 },
      });

      req.params.id = invoice._id.toString();

      await invoicesController.getById(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const returnedInvoice = res.json.mock.calls[0][0];
      expect(returnedInvoice.invoiceNumber).toBe("INV-GET-001");
      expect(returnedInvoice.company).toBeDefined();
    });

    it("sollte 404 zurückgeben wenn Rechnung nicht gefunden", async () => {
      // Gültige aber nicht existierende ObjectId
      const fakeId = new mongoose.Types.ObjectId();
      req.params.id = fakeId.toString();

      await invoicesController.getById(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Rechnung nicht gefunden");
    });

    it("sollte 500 zurückgeben bei ungültiger ID", async () => {
      req.params.id = "invalid-id";

      await invoicesController.getById(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].name).toBe("CastError");
    });
  });

  describe("create", () => {
    it("sollte eine neue Rechnung erstellen", async () => {
      req.body = {
        invoiceNumber: "INV-CREATE-001",
        date: "2026-01-28",
        deliveryDate: "2026-01-30",
        customer: {
          name: "New Customer",
          address: "Customer Address",
          city: "Customer City",
          postalCode: "54321",
        },
        items: [
          {
            name: "Product 1",
            quantity: 2,
            price: 50,
            tax: 19,
          },
        ],
        paymentMethod: "card",
        currency: "EUR",
        totals: {
          subtotal: 100,
          totalTax: 19,
          total: 119,
        },
      };

      await invoicesController.create(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const createdInvoice = res.json.mock.calls[0][0];
      expect(createdInvoice.invoiceNumber).toBe("INV-CREATE-001");
      expect(createdInvoice.customer.name).toBe("New Customer");
      expect(createdInvoice.items).toHaveLength(1);
    });

    it("sollte 409 zurückgeben bei doppelter Rechnungsnummer", async () => {
      // Erste Rechnung erstellen
      await Invoice.create({
        invoiceNumber: "INV-DUPLICATE",
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "Customer 1",
          address: "Address",
          city: "City",
          postalCode: "12345",
        },
      });

      // Versuchen, Rechnung mit gleicher Nummer zu erstellen
      req.body = {
        invoiceNumber: "INV-DUPLICATE",
        date: "2026-01-29",
        customer: {
          name: "Customer 2",
          address: "Address",
          city: "City",
          postalCode: "12345",
        },
      };

      await invoicesController.create(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.code).toBe(11000);
    });

    it("sollte Company automatisch erstellen wenn keine existiert", async () => {
      // Company löschen
      await Company.deleteMany({});

      req.body = {
        invoiceNumber: "INV-NO-COMPANY",
        date: "2026-01-28",
        customer: {
          name: "Customer",
          address: "Address",
          city: "City",
          postalCode: "12345",
        },
      };

      await invoicesController.create(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const createdInvoice = res.json.mock.calls[0][0];
      expect(createdInvoice.company).toBeDefined();

      // Prüfen ob Company erstellt wurde
      const companies = await Company.find();
      expect(companies).toHaveLength(1);
    });
  });

  describe("update", () => {
    it("sollte eine Rechnung aktualisieren", async () => {
      const invoice = await Invoice.create({
        invoiceNumber: "INV-UPDATE-001",
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "Old Customer",
          address: "Old Address",
          city: "Old City",
          postalCode: "11111",
        },
        totals: { total: 100 },
      });

      req.params.id = invoice._id.toString();
      req.body = {
        invoiceNumber: "INV-UPDATED",
        customer: {
          name: "Updated Customer",
          address: "Updated Address",
          city: "Updated City",
          postalCode: "22222",
        },
        totals: { total: 200 },
      };

      await invoicesController.update(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const updatedInvoice = res.json.mock.calls[0][0];
      expect(updatedInvoice.invoiceNumber).toBe("INV-UPDATED");
      expect(updatedInvoice.totals.total).toBe(200);
    });

    it("sollte 404 zurückgeben wenn Rechnung nicht gefunden", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      req.params.id = fakeId.toString();
      req.body = { invoiceNumber: "INV-999" };

      await invoicesController.update(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Rechnung nicht gefunden");
    });

    it("sollte 500 zurückgeben bei ungültiger ID", async () => {
      req.params.id = "invalid-id";
      req.body = { invoiceNumber: "INV-999" };

      await invoicesController.update(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].name).toBe("CastError");
    });
  });

  describe("remove", () => {
    it("sollte eine Rechnung löschen", async () => {
      const invoice = await Invoice.create({
        invoiceNumber: "INV-DELETE-001",
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "Customer",
          address: "Address",
          city: "City",
          postalCode: "12345",
        },
      });

      req.params.id = invoice._id.toString();

      await invoicesController.remove(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: "Rechnung erfolgreich gelöscht",
      });

      // Prüfen ob Rechnung wirklich gelöscht wurde
      const deletedInvoice = await Invoice.findById(invoice._id);
      expect(deletedInvoice).toBeNull();
    });

    it("sollte 404 zurückgeben wenn Rechnung nicht gefunden", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      req.params.id = fakeId.toString();

      await invoicesController.remove(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Rechnung nicht gefunden");
    });

    it("sollte 500 zurückgeben bei ungültiger ID", async () => {
      req.params.id = "invalid-id";

      await invoicesController.remove(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].name).toBe("CastError");
    });
  });
});
