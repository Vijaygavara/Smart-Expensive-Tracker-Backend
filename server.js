
import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/UserDetails.js";
import transactionRoutes from "./routes/TransactionRoutes.js"
import budgetRoutes from "./routes/budgetRoutes.js"

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Expense Tracker API Running");
});

app.use("/api", authRoutes);
app.use("/api", transactionRoutes);
app.use("/api", budgetRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});