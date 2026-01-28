import Company from "../models/Company.js";

/**
 * Holt die Firmendaten aus der Datenbank
 * Erstellt automatisch eine neue Firma mit Standardwerten, falls keine existiert
 * @route GET /api/company
 */
export const getCompany = async (req, res, next) => {
  try {
    let company = await Company.findOne();
    // Erstelle neue Firma mit Standardwerten falls noch keine existiert
    if (!company) {
      company = new Company();
      await company.save();
    }
    res.json(company);
  } catch (error) {
    next(error);
  }
};

/**
 * Aktualisiert die Firmendaten
 * Erstellt neue Firma falls noch keine existiert, sonst aktualisiert bestehende
 * @route PUT /api/company
 * @param {Object} req.body - Die aktualisierten Firmendaten (name, address, phone, etc.)
 */
export const updateCompany = async (req, res, next) => {
  try {
    let company = await Company.findOne();
    // Neue Firma erstellen oder bestehende aktualisieren
    if (!company) {
      company = new Company(req.body);
    } else {
      // Alle Felder aus req.body in company übernehmen
      Object.assign(company, req.body);
    }
    await company.save();
    res.json(company);
  } catch (error) {
    next(error);
  }
};
