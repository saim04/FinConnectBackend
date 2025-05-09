import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    default: 0, 
  },
  cnic: {
    type: String,
    required: false,   // not required
    unique: true,
    sparse: true   
  },
}, { timestamps: true }); 

accountSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
});

accountSchema.methods.updateBalance = async function (amount) {
  this.balance += amount;
  await this.save();
};

const Account = mongoose.model('Account', accountSchema);

export default Account;