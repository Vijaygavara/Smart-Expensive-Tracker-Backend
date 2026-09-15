// import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";

export const addTransaction = async (req, res) => {
  try {
    const {
      type,
      amount,
      category,
      description,
      transactionDate,
    } = req.body;

    // validation
    if (!type || !amount || !category || !transactionDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // create transaction
    const transaction = await Transaction.create({
      userId: req.user.id,
      type,
      amount,
      category,
      description,
      transactionDate,
    });

    return res.status(201).json({
      success: true,
      message: "Transaction added successfully",
      transaction,
    });
  } catch (error) {
    // console.log("Add transaction error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const {
      search,
      category,
      type,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {
      userId: req.user.id,
    };

    // Search by description
    if (search) {
      filter.description = {
        $regex: search,
        $options: "i",
      };
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by income / expense
    if (type) {
      filter.type = type;
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.transactionDate = {};

      if (startDate) {
        filter.transactionDate.$gte = new Date(startDate);
      }

      if (endDate) {
        filter.transactionDate.$lte = new Date(endDate);
      }
    }

    // Pagination
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const skip = (pageNumber - 1) * limitNumber;

    // Get total matching transactions
    const totalTransactions = await Transaction.countDocuments(filter);

    // Get transactions for current page
    const transactions = await Transaction.find(filter)
      .sort({
        transactionDate: -1,
      })
      .skip(skip)
      .limit(limitNumber);

    const totalPages = Math.ceil(
      totalTransactions / limitNumber
    );

    return res.status(200).json({
      success: true,
      count: transactions.length,
      totalTransactions,
      currentPage: pageNumber,
      totalPages,
      transactions,
    });
  } catch (error) {
    // console.log("Get transactions error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { type, amount, category, description, transactionDate } =
      req.body;

    const transaction = await Transaction.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,
      },
      {
        type,
        amount,
        category,
        description,
        transactionDate,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      transaction,
    });
  } catch (error) {
    // console.log("Update transaction error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    // console.log("Delete transaction error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getTransactionSummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    const filter = {
      userId: req.user.id,
    };

    // Monthly filter
    if (month && year) {
      const startDate = new Date(
        Number(year),
        Number(month) - 1,
        1
      );

      const endDate = new Date(
        Number(year),
        Number(month),
        1
      );

      filter.transactionDate = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    const transactions = await Transaction.find(filter);

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((transaction) => {
      if (transaction.type === "income") {
        totalIncome += transaction.amount;
      }

      if (transaction.type === "expense") {
        totalExpense += transaction.amount;
      }
    });

    const balance = totalIncome - totalExpense;

    return res.status(200).json({
      success: true,
      summary: {
        totalIncome,
        totalExpense,
        balance,
      },
    });
  } catch (error) {
    // console.log("Get transaction summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
export const getCategorySummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    const filter = {
      userId: new mongoose.Types.ObjectId(req.user.id),
      type: "expense",
    };

    if (month && year) {
      const startDate = new Date(
        Number(year),
        Number(month) - 1,
        1
      );

      const endDate = new Date(
        Number(year),
        Number(month),
        1
      );

      filter.transactionDate = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    // console.log("CATEGORY FILTER:", filter);

    const matchingTransactions = await Transaction.find(filter);

    // console.log(
    //   "MATCHING TRANSACTIONS:",
    //   matchingTransactions
    // );

    const categorySummary = await Transaction.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: "$category",
          totalAmount: {
            $sum: "$amount",
          },
        },
      },
      {
        $sort: {
          totalAmount: -1,
        },
      },
    ]);

    // console.log("CATEGORY SUMMARY:", categorySummary);

    const categories = categorySummary.map((item) => ({
      category: item._id,
      amount: item.totalAmount,
    }));

    return res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    // console.log("Get category summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getRecentTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user.id,
    })
      .sort({
        transactionDate: -1,
      })
      .limit(5);

    return res.status(200).json({
      success: true,
      transactions,
    });
  } catch (error) {
    // console.log("Get recent transactions error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
export const getMonthlySummary = async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: "Year is required",
      });
    }

    const monthlySummary = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          transactionDate: {
            $gte: new Date(Number(year), 0, 1),
            $lt: new Date(Number(year) + 1, 0, 1),
          },
        },
      },
      {
        $group: {
          _id: {
            month: {
              $month: "$transactionDate",
            },
            type: "$type",
          },
          totalAmount: {
            $sum: "$amount",
          },
        },
      },
      {
        $sort: {
          "_id.month": 1,
        },
      },
    ]);

    const data = Array.from({ length: 12 }, (_, index) => ({
      month: new Date(2000, index, 1).toLocaleString("en-US", {
        month: "short",
      }),
      income: 0,
      expense: 0,
    }));

    monthlySummary.forEach((item) => {
      const monthIndex = item._id.month - 1;

      if (item._id.type === "income") {
        data[monthIndex].income = item.totalAmount;
      }

      if (item._id.type === "expense") {
        data[monthIndex].expense = item.totalAmount;
      }
    });

    return res.status(200).json({
      success: true,
      year: Number(year),
      data,
    });
  } catch (error) {
    // console.log("Get monthly summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
