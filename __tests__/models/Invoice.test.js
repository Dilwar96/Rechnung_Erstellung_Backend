import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Invoice from "../../models/Invoice.js";
import Company from "../../models/Company.js";

describe("Invoice Model", () => {
  let mongoServer;
  let testCompany;

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
  });

  describe("Schema Validation", () => {
    it("sollte eine Invoice mit gültigen Daten erstellen", async () => {
      const invoiceData = {
        invoiceNumber: "INV-001",
        date: "2026-01-28",
        deliveryDate: "2026-01-30",
        company: testCompany._id,
        customer: {
          name: "Test Customer",
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

      const invoice = new Invoice(invoiceData);
      const savedInvoice = await invoice.save();

      expect(savedInvoice._id).toBeDefined();
      expect(savedInvoice.invoiceNumber).toBe("INV-001");
      expect(savedInvoice.date).toBe("2026-01-28");
      expect(savedInvoice.customer.name).toBe("Test Customer");
      expect(savedInvoice.items.length).toBe(1);
      expect(savedInvoice.totals.total).toBe(119);
    });

    it("sollte Fehler werfen wenn invoiceNumber fehlt", async () => {
      const invoice = new Invoice({
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "Customer",
          address: "Address",
          city: "City",
          postalCode: "12345",
        },
      });

      await expect(invoice.save()).rejects.toThrow();
    });

    it("sollte Fehler werfen wenn date fehlt", async () => {
      const invoice = new Invoice({
        invoiceNumber: "INV-002",
        company: testCompany._id,
        customer: {
          name: "Customer",
          address: "Address",
          city: "City",
          postalCode: "12345",
        },
      });

      await expect(invoice.save()).rejects.toThrow();
    });

    it("sollte Fehler werfen bei doppelter invoiceNumber", async () => {
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

      const duplicateInvoice = new Invoice({
        invoiceNumber: "INV-DUPLICATE",
        date: "2026-01-29",
        company: testCompany._id,
        customer: {
          name: "Customer 2",
          address: "Address",
          city: "City",
          postalCode: "12345",
        },
      });

      await expect(duplicateInvoice.save()).rejects.toThrow();
    });
  });

  describe("Customer Schema", () => {
    it("sollte Customer mit allen Pflichtfeldern erstellen", async () => {
      const invoice = new Invoice({
        invoiceNumber: "INV-CUST-001",
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "John Doe",
          address: "456 Customer St",
          city: "Hamburg",
          postalCode: "20095",
        },
      });

      await invoice.save();

      expect(invoice.customer.name).toBe("John Doe");
      expect(invoice.customer.address).toBe("456 Customer St");
      expect(invoice.customer.city).toBe("Hamburg");
      expect(invoice.customer.postalCode).toBe("20095");
    });

    it("sollte optionale customFields speichern", async () => {
      const invoice = new Invoice({
        invoiceNumber: "INV-CUSTOM-001",
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "Customer",
          address: "Address",
          city: "City",
          postalCode: "12345",
          customField1: "Custom Value 1",
          customField2: "Custom Value 2",
        },
      });

      await invoice.save();

      expect(invoice.customer.customField1).toBe("Custom Value 1");
      expect(invoice.customer.customField2).toBe("Custom Value 2");
    });

    it("sollte Fehler werfen wenn Customer-Pflichtfelder fehlen", async () => {
      const invoice = new Invoice({
        invoiceNumber: "INV-003",
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "Customer",
          // Fehlende address, city, postalCode
        },
      });

      await expect(invoice.save()).rejects.toThrow();
    });
  });

  describe("Invoice Items", () => {
    it("sollte mehrere Items speichern", async () => {
      const invoice = new Invoice({
        invoiceNumber: "INV-ITEMS-001",
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "Customer",
          address: "Address",
          city: "City",
          postalCode: "12345",
        },
        items: [
          { name: "Item 1", quantity: 1, price: 100, tax: 19 },
          { name: "Item 2", quantity: 2, price: 50, tax: 19 },
          { name: "Item 3", quantity: 3, price: 25, tax: 7 },
        ],
      });

      await invoice.save();

      expect(invoice.items.length).toBe(3);
      expect(invoice.items[0].name).toBe("Item 1");
      expect(invoice.items[1].quantity).toBe(2);
      expect(invoice.items[2].price).toBe(25);
    });

    it("sollte Item mit Standardwerten erstellen", async () => {
      const invoice = new Invoice({
        invoiceNumber: "INV-DEFAULTS-001",
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "Customer",
          address: "Address",
          city: "City",
          postalCode: "12345",
        },
        items: [{ name: "Minimal Item", price: 99 }],
      });

      await invoice.save();

      expect(invoice.items[0].quantity).toBe(1);
      expect(invoice.items[0].tax).toBe(19);
    });

    it("sollte leeres Items-Array akzeptieren", async () => {
      const invoice = new Invoice({
        invoiceNumber: "INV-EMPTY-001",
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "Customer",
          address: "Address",
          city: "City",
          postalCode: "12345",
        },
        items: [],
      });

      await invoice.save();

      expect(invoice.items.length).toBe(0);
    });
  });

  describe("Payment Method", () => {
    it('sollte "card" als Zahlungsmethode akzeptieren', async () => {
      const invoice = new Invoice({
        invoiceNumber: "INV-CARD-001",
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "Customer",
          address: "Address",
          city: "City",
          postalCode: "12345",
        },
        paymentMethod: "card",
      });

      await invoice.save();
      expect(invoice.paymentMethod).toBe("card");
    });

    it('sollte "cash" als Zahlungsmethode akzeptieren', async () => {
      const invoice = new Invoice({
        invoiceNumber: "INV-CASH-001",
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "Customer",
          address: "Address",
          city: "City",
          postalCode: "12345",
        },
        paymentMethod: "cash",
      });

      await invoice.save();
      expect(invoice.paymentMethod).toBe("cash");
    });

    it('sollte "card" als Standard setzen', async () => {
      const invoice = new Invoice({
        invoiceNumber: "INV-DEFAULT-PAY-001",
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "Customer",
          address: "Address",
          city: "City",
          postalCode: "12345",
        },
      });

      await invoice.save();
      expect(invoice.paymentMethod).toBe("card");
    });
  });

  describe("Currency", () => {
    it('sollte "EUR" als Standard-Währung setzen', async () => {
      const invoice = new Invoice({
        invoiceNumber: "INV-CURRENCY-001",
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "Customer",
          address: "Address",
          city: "City",
          postalCode: "12345",
        },
      });

      await invoice.save();
      expect(invoice.currency).toBe("EUR");
    });

    it("sollte benutzerdefinierte Währung speichern", async () => {
      const invoice = new Invoice({
        invoiceNumber: "INV-USD-001",
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "Customer",
          address: "Address",
          city: "City",
          postalCode: "12345",
        },
        currency: "USD",
      });

      await invoice.save();
      expect(invoice.currency).toBe("USD");
    });
  });

  describe("Totals", () => {
    it("sollte alle Total-Felder mit Standardwerten erstellen", async () => {
      const invoice = new Invoice({
        invoiceNumber: "INV-TOTALS-001",
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "Customer",
          address: "Address",
          city: "City",
          postalCode: "12345",
        },
      });

      await invoice.save();

      expect(invoice.totals.subtotal).toBe(0);
      expect(invoice.totals.totalTax).toBe(0);
      expect(invoice.totals.total).toBe(0);
    });

    it("sollte benutzerdefinierte Totals speichern", async () => {
      const invoice = new Invoice({
        invoiceNumber: "INV-TOTALS-002",
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "Customer",
          address: "Address",
          city: "City",
          postalCode: "12345",
        },
        totals: {
          subtotal: 500,
          totalTax: 95,
          total: 555,
        },
      });

      await invoice.save();

      expect(invoice.totals.subtotal).toBe(500);
      expect(invoice.totals.totalTax).toBe(95);
      expect(invoice.totals.total).toBe(555);
    });
  });

  describe("Company Reference", () => {
    it("sollte Company per populate laden", async () => {
      const invoice = new Invoice({
        invoiceNumber: "INV-POPULATE-001",
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "Customer",
          address: "Address",
          city: "City",
          postalCode: "12345",
        },
      });

      await invoice.save();
      const populatedInvoice = await Invoice.findById(invoice._id).populate(
        "company",
      );

      expect(populatedInvoice.company.name).toBe("Test Company");
      expect(populatedInvoice.company.email).toBe("test@test.com");
    });

    it("sollte Fehler werfen wenn company fehlt", async () => {
      const invoice = new Invoice({
        invoiceNumber: "INV-NO-COMPANY-001",
        date: "2026-01-28",
        customer: {
          name: "Customer",
          address: "Address",
          city: "City",
          postalCode: "12345",
        },
      });

      await expect(invoice.save()).rejects.toThrow();
    });
  });

  describe("Timestamps", () => {
    it("sollte createdAt und updatedAt automatisch setzen", async () => {
      const invoice = new Invoice({
        invoiceNumber: "INV-TIME-001",
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "Customer",
          address: "Address",
          city: "City",
          postalCode: "12345",
        },
      });

      const beforeSave = new Date();
      await invoice.save();
      const afterSave = new Date();

      expect(invoice.createdAt).toBeDefined();
      expect(invoice.updatedAt).toBeDefined();
      expect(invoice.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeSave.getTime(),
      );
      expect(invoice.createdAt.getTime()).toBeLessThanOrEqual(
        afterSave.getTime(),
      );
    });

    it("sollte updatedAt aktualisieren bei Änderungen", async () => {
      const invoice = new Invoice({
        invoiceNumber: "INV-UPDATE-001",
        date: "2026-01-28",
        company: testCompany._id,
        customer: {
          name: "Customer",
          address: "Address",
          city: "City",
          postalCode: "12345",
        },
      });

      await invoice.save();
      const firstUpdatedAt = invoice.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      invoice.totals.total = 999;
      await invoice.save();

      expect(invoice.updatedAt.getTime()).toBeGreaterThan(
        firstUpdatedAt.getTime(),
      );
    });
  });
});
