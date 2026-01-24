import Invoice from '../models/Invoice.js';
import Company from '../models/Company.js';

/**
 * Entfernt rekursiv alle _id-Felder aus einem Objekt oder Array
 * Verhindert Konflikte mit MongoDB's automatisch generierten IDs
 * @param {Object|Array} obj - Das zu bereinigende Objekt oder Array
 * @returns {Object|Array} - Das bereinigte Objekt ohne _id-Felder
 */
function removeId(obj) {
  if (Array.isArray(obj)) return obj.map(removeId);
  if (obj && typeof obj === 'object') {
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
export const getAll = async (req, res) => {
  try {
    // Rechnungen abrufen und Company-Daten einbinden
    const invoices = await Invoice.find().populate('company').sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    console.error('Fehler beim Abrufen der Rechnungen:', error);
    res.status(500).json({ message: 'Serverfehler' });
  }
};

/**
 * Holt eine einzelne Rechnung anhand der ID
 * @route GET /api/invoices/:id
 * @param {string} req.params.id - Die Rechnungs-ID
 */
export const getById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('company');
    if (!invoice) return res.status(404).json({ message: 'Rechnung nicht gefunden' });
    res.json(invoice);
  } catch (error) {
    console.error('Fehler beim Abrufen der Rechnung:', error);
    res.status(500).json({ message: 'Serverfehler' });
  }
};

/**
 * Erstellt eine neue Rechnung
 * @route POST /api/invoices
 * @param {Object} req.body - Die Rechnungsdaten
 */
export const create = async (req, res) => {
  try {
    const { invoiceNumber, date, deliveryDate, customer, items, paymentMethod, currency, totals } = req.body;

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
      totals: cleanTotals
    });
    await invoice.save();
    await invoice.populate('company');
    res.json(invoice);
  } catch (error) {
    console.error('Fehler beim Erstellen der Rechnung:', error);
    // Prüfe auf doppelte Rechnungsnummer
    if (error.code === 11000 && error.keyPattern && error.keyPattern.invoiceNumber) {
      return res.status(409).json({
        message: 'Eine Rechnung mit dieser Rechnungsnummer existiert bereits.',
        error: 'DUPLICATE_INVOICE_NUMBER',
        invoiceNumber: req.body.invoiceNumber
      });
    }
    res.status(500).json({ message: 'Serverfehler', error: error.message, code: error.code || undefined });
  }
};

/**
 * Aktualisiert eine bestehende Rechnung
 * @route PUT /api/invoices/:id
 * @param {string} req.params.id - Die Rechnungs-ID
 * @param {Object} req.body - Die aktualisierten Rechnungsdaten
 */
export const update = async (req, res) => {
  try {
    // Aktualisiere Rechnung und gib die neue Version zurück
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('company');
    if (!invoice) return res.status(404).json({ message: 'Rechnung nicht gefunden' });
    res.json(invoice);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Rechnung:', error);
    res.status(500).json({ message: 'Serverfehler' });
  }
};

/**
 * Löscht eine Rechnung aus der Datenbank
 * @route DELETE /api/invoices/:id
 * @param {string} req.params.id - Die Rechnungs-ID
 */
export const remove = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Rechnung nicht gefunden' });
    res.json({ message: 'Rechnung erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Rechnung:', error);
    res.status(500).json({ message: 'Serverfehler' });
  }
};
