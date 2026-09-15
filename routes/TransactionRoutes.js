// import express from "express";
// import authMiddleware from "../middlewares/authMiddleware.js";
// import { addTransaction } from "../controllers/transactionController.js";
import express from "express";
import authMiddleware from "../middlewares/UserDetailsMiddleware.js";
import { addTransaction, deleteTransaction, getCategorySummary, getMonthlySummary, getRecentTransactions, getTransactions, getTransactionSummary, updateTransaction } from "../controllers/transactionController.js";


const router = express.Router();

router.get(
  "/transactions/summary",
  authMiddleware,
  getTransactionSummary
);

router.get(
  "/transactions/category-summary",
  authMiddleware,
  getCategorySummary
);
router.get(
  "/transactions/monthly-summary",
  authMiddleware,
  getMonthlySummary
);

router.post("/transactions", authMiddleware, addTransaction);
router.get("/transactions", authMiddleware, getTransactions);
router.put(
  "/transactions/:id",
  authMiddleware,
  updateTransaction
);
router.delete(
  "/transactions/:id",
  authMiddleware,
  deleteTransaction
);
router.get(
  "/transactions/recent",
  authMiddleware,
  getRecentTransactions
);


export default router;