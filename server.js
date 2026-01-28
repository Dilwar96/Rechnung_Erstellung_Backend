import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import companyRouter from "./routes/company.js";
import invoicesRouter from "./routes/invoices.js";
import adminRouter from "./routes/admin.js";
import errorHandler from "./middleware/errorHandler.js";

dotenv.config({ path: "./config.env" });

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Routes
app.use("/api/company", companyRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/admin", adminRouter);

// Error Handler Middleware (muss nach allen Routes kommen)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
