import Account from "../models/Account.model.js";
import User from "../models/User.model.js";
import Invoice from "../models/Invoice.model.js";
import mongoose from "mongoose";

export const checkBalance = async (req, res) => {
  try {
    const { userId: requestedUserId } = req.body;
    const decodedId = req.user.id; // From middleware
    console.log(req.user);
    console.log(req.plan);

    if (decodedId !== requestedUserId) {
      return res
        .status(403)
        .json({ message: "Unauthorized access. User IDs do not match" });
    }

    const userId = new mongoose.Types.ObjectId(decodedId);

    const account = await Account.findOne({ userId });

    if (!account) {
      return res
        .status(404)
        .json({ message: "Account not found for this user" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Account found",
      balance: account.balance,
      username: user.fullName,
      lastUpdate : account.updatedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const depositMoney = async (req, res) => {
  try {
    const { userId: requestedUserId, amount } = req.body;
    const decodedId = req.user.id;

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: "Invalid deposit amount" });
    }

    if (decodedId !== requestedUserId) {
      return res
        .status(403)
        .json({ message: "Unauthorized access. User IDs do not match" });
    }

    const userId = new mongoose.Types.ObjectId(decodedId);

    const account = await Account.findOne({ userId });

    if (!account) {
      return res
        .status(404)
        .json({ message: "Account not found for this user" });
    }

    account.balance += numericAmount;
    await account.save();

    res.status(200).json({
      message: "Deposit successful",
      newBalance: account.balance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const createAccount = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log(req.body);

    const decodedId = req.user.id;

    if (userId !== decodedId) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const user = await User.findById(userId);
    console.log(user);
    if (!user) return res.status(404).json({ message: "User not found" });

    const existingAccount = await Account.findOne({ userId });
    if (existingAccount) {
      return res
        .status(400)
        .json({ message: "Account already exists for this user" });
    }

    const account = new Account({
      userId,
      balance: 0,
      cnic: req.body.cnic || null,
    });

    await account.save();

    res.status(201).json({
      message: "Account created successfully",
      accountId: account._id,
      balance: account.balance,
      cnic: account.cnic,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const transferMoney = async (req, res) => {
  try {
    const { senderId, receiverId, amount } = req.body;
    const decodedId = req.user.id;

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: "Invalid transfer amount" });
    }

    if (decodedId !== senderId) {
      return res
        .status(403)
        .json({ message: "Unauthorized. Sender ID mismatch" });
    }

    const senderObjectId = new mongoose.Types.ObjectId(senderId);
    const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

    const senderAccount = await Account.findOne({ userId: senderObjectId });
    const receiverAccount = await Account.findOne({ userId: receiverObjectId });

    if (!senderAccount) {
      return res.status(404).json({ message: "Sender account not found" });
    }

    if (!receiverAccount) {
      return res.status(404).json({ message: "Receiver account not found" });
    }


    if (senderAccount.balance < numericAmount) {
      return res
        .status(400)
        .json({ message: "Insufficient balance in sender account" });
    }

    senderAccount.balance -= numericAmount;
    receiverAccount.balance += numericAmount;

    await senderAccount.save();
    await receiverAccount.save();

    res.status(200).json({
      message: "Transfer successful",
      senderBalance: senderAccount.balance,
      receiverBalance: receiverAccount.balance,
      senderId: senderAccount.id,
      receiverId: receiverAccount.id,
      amountTransferred: numericAmount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getAllTransaction = async (req, res) => {
  try {
    // Extract pagination parameters from query
    const { page = 1, page_size = 5 } = req.query;
    const skip = (page - 1) * page_size;

    // Extract userId from the request object (from middleware)
    const userId = req.user.id;

    const userAccounts = await Account.find({ userId }).select('_id');
    const accountIds = userAccounts.map(acc => acc._id);
    // Populate sender and receiver account details along with user information
    const invoices = await Invoice.find({
      $or: [
        { senderAccountId: accountIds},   // Filter for invoices where user is the sender
        { receiverAccountId: accountIds},  // Filter for invoices where user is the receiver
      ],
    })
      .skip(skip)
      .limit(Number(page_size))
      .populate({
        path: "senderAccountId",
        populate: {
          path: "userId",
          select: "fullName email role",  // Only select necessary user fields
        },
      })
      .populate({
        path: "receiverAccountId",
        populate: {
          path: "userId",
          select: "fullName email role",  // Only select necessary user fields
        },
    });

    // Check if no invoices are found
    if (!invoices || invoices.length === 0) {
      return res.status(404).json({ message: "No invoices found." });
    }

    // Send the paginated invoices as the response
    res.status(200).json(invoices);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error. Unable to fetch invoices." });
  }
};
