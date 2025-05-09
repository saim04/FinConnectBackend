import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  senderAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  receiverAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
}, { timestamps: true }); 

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
