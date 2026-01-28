import Invoice from "../models/Invoice.js";
import Company from "../models/Company.js";
import AppError from "../utils/AppError.js";

/**
 * Entfernt rekursiv alle _id-Felder aus einem Objekt oder Array
 * Verhindert Konflikte mit MongoDB's automatisch generierten IDs
 * @param {Object|Array} obj - Das zu bereinigende Objekt oder Array
 * @returns {Object|Array} - Das bereinigte Objekt ohne _id-Felder
 */
function removeId(obj) {
  if (Array.isArray(obj)) return obj.map(removeId);
  if (obj && typeof obj === "object") {
    const { _id, ...rest } = obj;
    for (const key in rest) {
      rest[key] = removeId(rest[key]);
    }
    return rest;
  }
  return obj;
}

/**
 * Holt alle Rechnungen aus der Datenbank
 * Sortiert nach Erstellungsdatum (neueste zuerst)
 * @route GET /api/invoices
 */
export const getAll = async (req, res, next) => {
  try {
    // Rechnungen abrufen und Company-Daten einbinden
    const invoices = await Invoice.find()
      .populate("company")
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    next(error);
  }
};

/**
 * Holt eine einzelne Rechnung anhand der ID
 * @route GET /api/invoices/:id
 * @param {string} req.params.id - Die Rechnungs-ID
 */
export const getById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate("company");
    if (!invoice) throw new AppError("Rechnung nicht gefunden", 404);
    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

/**
 * Erstellt eine neue Rechnung
 * @route POST /api/invoices
 * @param {Object} req.body - Die Rechnungsdaten
 */
export const create = async (req, res, next) => {
  try {
    const {
      invoiceNumber,
      date,
      deliveryDate,
      customer,
      items,
      paymentMethod,
      currency,
      totals,
    } = req.body;

    // Entferne _id-Felder aus eingehenden Daten
    // Verhindert Konflikte mit MongoDB's automatischen IDs
    const cleanItems = removeId(items || []);
    const cleanCustomer = removeId(customer || {});
    const cleanTotals = removeId(totals || {});

    // Company-Datensatz abrufen oder erstellen
    let company = await Company.findOne();
    if (!company) {
      company = new Company();
      await company.save();
    }

    // Neue Rechnung erstellen
    const invoice = new Invoice({
      invoiceNumber,
      date,
      deliveryDate,
      company: company._id,
      customer: cleanCustomer,
      items: cleanItems,
      paymentMethod,
      currency,
      totals: cleanTotals,
    });
    await invoice.save();
    await invoice.populate("company");
    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

/**
 * Aktualisiert eine bestehende Rechnung
 * @route PUT /api/invoices/:id
 * @param {string} req.params.id - Die Rechnungs-ID
 * @param {Object} req.body - Die aktualisierten Rechnungsdaten
 */
export const update = async (req, res, next) => {
  try {
    // Aktualisiere Rechnung und gib die neue Version zurück
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("company");
    if (!invoice) throw new AppError("Rechnung nicht gefunden", 404);
    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

/**
 * Löscht eine Rechnung aus der Datenbank
 * @route DELETE /api/invoices/:id
 * @param {string} req.params.id - Die Rechnungs-ID
 */
export const remove = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) throw new AppError("Rechnung nicht gefunden", 404);
    res.json({ message: "Rechnung erfolgreich gelöscht" });
  } catch (error) {
    next(error);
  }
};
