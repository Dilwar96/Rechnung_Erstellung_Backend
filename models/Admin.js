import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save Hook: Passwort automatisch hashen mit Salt, wenn es geändert wurde
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    // Salt-Runden: 12 für erhöhte Sicherheit
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Methode zum Vergleichen des eingegebenen Passworts mit dem gehashten Passwort
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("Admin", adminSchema);
