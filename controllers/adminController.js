import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";

/**
 * Admin-Login mit Benutzername und Passwort
 * Erstellt JWT-Token bei erfolgreicher Authentifizierung
 * @route POST /api/admin/login
 * @param {string} req.body.username - Admin Benutzername
 * @param {string} req.body.password - Admin Passwort
 */
export const login = async (req, res, next) => {
  const { username, password } = req.body;
  try {
    // Admin in Datenbank suchen
    const admin = await Admin.findOne({ username });
    if (!admin)
      throw new AppError("Ungültiger Benutzername oder Passwort", 401);

    // Passwort prüfen mit Model-Methode
    const isMatch = await admin.comparePassword(password);
    if (!isMatch)
      throw new AppError("Ungültiger Benutzername oder Passwort", 401);

    // JWT-Token erstellen (Gültig für 1 Tag)
    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );
    res.json({ token, username: admin.username });
  } catch (error) {
    next(error);
  }
};

/**
 * Ändert Admin-Anmeldedaten (Benutzername und/oder Passwort)
 * Erfordert Authentifizierung und altes Passwort zur Bestätigung
 * @route POST /api/admin/change-credentials
 * @param {string} req.body.oldPassword - Aktuelles Passwort zur Bestätigung
 * @param {string} [req.body.newUsername] - Neuer Benutzername (optional)
 * @param {string} [req.body.newPassword] - Neues Passwort (optional)
 */
export const changeCredentials = async (req, res, next) => {
  try {
    // Admin aus Datenbank abrufen (ID kommt vom Auth-Token)
    const admin = await Admin.findById(req.user.id);
    if (!admin) throw new AppError("Admin nicht gefunden", 404);

    const { oldPassword, newUsername, newPassword } = req.body;

    // Altes Passwort verifizieren mit Model-Methode
    const isMatch = await admin.comparePassword(oldPassword);
    if (!isMatch) throw new AppError("Altes Passwort ist falsch", 401);

    // Benutzername aktualisieren falls angegeben
    if (newUsername) admin.username = newUsername;

    // Neues Passwort setzen (wird automatisch durch Pre-save Hook gehasht)
    if (newPassword) admin.password = newPassword;

    await admin.save();
    res.json({ message: "Anmeldedaten aktualisiert" });
  } catch (error) {
    next(error);
  }
};
