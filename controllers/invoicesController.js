const Invoice = require('../models/Invoice');
const Company = require('../models/Company');

function removeId(obj) {
  if (Array.isArray(obj)) return obj.map(removeId);
  if (obj && typeof obj === 'object') {
    const { _id, ...rest } = obj;
    for (const key in rest) {
      rest[key] = removeId(rest[key]);
    }
    return rest;
  }
  return obj;
}

exports.getAll = async (req, res) => {
  try {
    const invoices = await Invoice.find().populate('company').sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('company');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { invoiceNumber, date, deliveryDate, customer, items, paymentMethod, currency, totals } = req.body;

    const cleanItems = removeId(items || []);
    const cleanCustomer = removeId(customer || {});
    const cleanTotals = removeId(totals || {});

    let company = await Company.findOne();
    if (!company) {
      company = new Company();
      await company.save();
    }

    const invoice = new Invoice({
      invoiceNumber,
      date,
      deliveryDate,
      company: company._id,
      customer: cleanCustomer,
      items: cleanItems,
      paymentMethod,
      currency,
      totals: cleanTotals
    });
    await invoice.save();
    await invoice.populate('company');
    res.json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    if (error.code === 11000 && error.keyPattern && error.keyPattern.invoiceNumber) {
      return res.status(409).json({
        message: 'Eine Rechnung mit dieser Rechnungsnummer existiert bereits.',
        error: 'DUPLICATE_INVOICE_NUMBER',
        invoiceNumber: req.body.invoiceNumber
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message, code: error.code || undefined });
  }
};

exports.update = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('company');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
