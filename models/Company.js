import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'Your Company Name'
  },
  owner: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    required: true,
    default: '123 Business Street'
  },
  city: {
    type: String,
    required: true,
    default: 'Berlin'
  },
  postalCode: {
    type: String,
    required: true,
    default: '10115'
  },
  phone: {
    type: String,
    required: true,
    default: '+49 30 12345678'
  },
  email: {
    type: String,
    required: true,
    default: 'info@yourcompany.com'
  },
  taxNumber: {
    type: String,
    required: true,
    default: 'DE123456789'
  },
  bankName: {
    type: String,
    required: true,
    default: 'Deutsche Bank'
  },
  accountNumber: {
    type: String,
    required: true,
    default: '1234567890'
  },
  iban: {
    type: String,
    required: true,
    default: 'DE89370400440532013000'
  },
  swift: {
    type: String,
    required: true,
    default: 'DEUTDEFF'
  },
  logo: {
    type: String,
    default: '' // Base64-String oder URL
  }
}, {
  timestamps: true
});

export default mongoose.model('Company', companySchema); 