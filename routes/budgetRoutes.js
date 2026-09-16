import express from "express";
import authMiddleware from "../middlewares/UserDetailsMiddleware.js";

import {
  createBudget,
  deleteBudget,
  getBudgets,
  updateBudget,
} from "../controllers/budgetController.js";

const router = express.Router();

router.post(
  "/budgets",
  authMiddleware,
  createBudget
);
router.get(
  "/budgets",
  authMiddleware,
  getBudgets
);
router.put(
  "/budgets/:id",
  authMiddleware,
  updateBudget
);
router.delete(
  "/budgets/:id",
  authMiddleware,
  deleteBudget
);


export default router;