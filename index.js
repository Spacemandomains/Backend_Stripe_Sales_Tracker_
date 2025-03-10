require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

const TARGET_PRODUCT_ID = "prod_RuhapEL1ywt1G1"; // 🔥 Replace with your actual product ID

app.get('/sales', async (req, res) => {
    try {
        const transactions = await stripe.paymentIntents.list({ limit: 10 });
        const filteredTransactions = [];

        for (let transaction of transactions.data) {
            const charge = await stripe.paymentIntents.retrieve(transaction.id, {
                expand: ["charges.data.balance_transaction"]
            });

            const lineItems = await stripe.checkout.sessions.listLineItems(transaction.id);

            for (let item of lineItems.data) {
                if (item.price.product === TARGET_PRODUCT_ID) {
                    filteredTransactions.push(transaction);
                    break;
                }
            }
        }

        res.json({ data: filteredTransactions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
