import mongoose from 'mongoose';
import Account from '../models/Account.model.js';
import Invoice from '../models/Invoice.model.js';



export const generateInvoice = async (req, res) => {
  try {
    const { senderAccountId, receiverAccountId, amount } = req.body;
    const decodedUserId = req.user.id;
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: 'Invalid invoice amount' });
    }

    const senderAccount = await Account.findById(senderAccountId);
    const receiverAccount = await Account.findById(receiverAccountId);

    if (!senderAccount || !receiverAccount) {
      return res.status(404).json({ message: 'Sender or receiver account not found' });
    }

    if (senderAccount.userId.toString() !== decodedUserId) {
      return res.status(403).json({ message: 'Unauthorized: You do not own the sender account' });
    }

    const invoice = await Invoice.create({
      senderAccountId: senderAccount._id,
      receiverAccountId: receiverAccount._id,
      amount: numericAmount,
    });

    res.status(201).json({
      message: 'Invoice generated successfully',
      invoiceId: invoice._id,
      senderAccountId: invoice.senderAccountId,
      receiverAccountId: invoice.receiverAccountId,
      amount: invoice.amount,
      createdAt: invoice.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const userAccounts = await Account.find({ userId }).select('_id');
    const accountIds = userAccounts.map(acc => acc._id);

    const invoices = await Invoice.find({
      $and: [
        {
          $or: [
            { senderAccountId: { $in: accountIds } },
            { receiverAccountId: { $in: accountIds } },
          ],
        },
        { createdAt: { $gte: start, $lte: end } },
      ]
    })
      .populate({
        path: "senderAccountId",
        populate: {
          path: "userId",
          select: "fullName email role"
        }
      })
      .populate({
        path: "receiverAccountId",
        populate: {
          path: "userId",
          select: "fullName email role"
        }
      });

    if (!invoices || invoices.length === 0) {
      return res.status(404).json({ message: "No invoices found in the given date range." });
    }

    res.status(200).json(invoices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Unable to fetch invoices.", error: error.message });
  }
};
