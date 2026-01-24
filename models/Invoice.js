import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  tax1: {
    type: Number,
    required: true,
    default: 19
  },
  discount: {
    type: Number,
    required: true,
    default: 0
  },
  tip: {
    type: Number,
    required: true,
    default: 0
  }
});

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  },
  customField1: {
    type: String,
    required: false
  },
  customField2: {
    type: String,
    required: false
  }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: String,
    required: true
  },
  deliveryDate: {
    type: String,
    required: false
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  customer: {
    type: customerSchema,
    required: true
  },
  items: [invoiceItemSchema],
  paymentMethod: {
    type: String,
    enum: ['card', 'cash'],
    default: 'card'
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  totals: {
    subtotal: {
      type: Number,
      default: 0
    },
    totalDiscount: {
      type: Number,
      default: 0
    },
    totalTax1: {
      type: Number,
      default: 0
    },
    totalTip: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

export default mongoose.model('Invoice', invoiceSchema); 