import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";

export const createBudget = async (req, res) => {
  try {
    const {
      category,
      amount,
      month,
      year,
    } = req.body;

    // 1. Validate required fields
    if (
      !category ||
      amount === undefined ||
      !month ||
      !year
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // 2. Check if budget already exists
    const existingBudget = await Budget.findOne({
      userId: req.user.id,
      category,
      month,
      year,
    });

    if (existingBudget) {
      return res.status(400).json({
        success: false,
        message:
          "Budget already exists for this category and month",
      });
    }

    // 3. Create budget
    const budget = await Budget.create({
      userId: req.user.id,
      category,
      amount,
      month,
      year,
    });

    return res.status(201).json({
      success: true,
      message: "Budget created successfully",
      budget,
    });
  } catch (error) {
    console.log("Create budget error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};



export const getBudgets = async (req, res) => {
  try {
    const { month, year } = req.query;

    const filter = {
      userId: new mongoose.Types.ObjectId(req.user.id),
    };

    // If month and year are provided,
    // return budgets only for that month
    if (month && year) {
      filter.month = Number(month);
      filter.year = Number(year);
    }

    // Get budgets
    const budgets = await Budget.find(filter);

    const budgetData = await Promise.all(
      budgets.map(async (budget) => {
        const startDate = new Date(
          budget.year,
          budget.month - 1,
          1
        );

        const endDate = new Date(
          budget.year,
          budget.month,
          1
        );

        const result = await Transaction.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(req.user.id),
              category: budget.category,
              type: "expense",
              transactionDate: {
                $gte: startDate,
                $lt: endDate,
              },
            },
          },
          {
            $group: {
              _id: null,
              totalSpent: {
                $sum: "$amount",
              },
            },
          },
        ]);

        const spent = result[0]?.totalSpent || 0;

        const remaining = budget.amount - spent;

        const percentage =
          budget.amount > 0
            ? (spent / budget.amount) * 100
            : 0;

        return {
          id: budget._id,
          category: budget.category,
          budget: budget.amount,
          spent,
          remaining,
          percentage: Number(percentage.toFixed(2)),
          month: budget.month,
          year: budget.year,
        };
      })
    );

    return res.status(200).json({
      success: true,
      budgets: budgetData,
    });
  } catch (error) {
    console.log("Get budgets error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const { amount } = req.body;

    // Validate amount
    if (amount === undefined || amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid budget amount",
      });
    }

    // Update only user's own budget
    const budget = await Budget.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,
      },
      {
        amount,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Budget updated successfully",
      budget,
    });
  } catch (error) {
    console.log("Update budget error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
export const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Budget deleted successfully",
    });
  } catch (error) {
    console.log("Delete budget error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};