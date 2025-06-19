// model/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    brand: { type: String },
    price: { type: Number },
    quantity: { type: Number }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
