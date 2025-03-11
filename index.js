require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

app.get('/sales', async (req, res) => {
    try {
        console.log("Fetching donation transactions from Stripe...");

        // ✅ Fetch last 10 successful payments (donations)
        const transactions = await stripe.paymentIntents.list({
            limit: 10,
            status: "succeeded" // Only fetch successful donations
        });

        console.log("Stripe Transactions:", transactions);

        if (!transactions || !transactions.data) {
            throw new Error("No successful transactions found");
        }

        // ✅ Process each donation and return proper amounts
        const processedTransactions = transactions.data.map(transaction => ({
            id: transaction.id,
            amount: transaction.amount_received, // Amount donated in cents
            currency: transaction.currency,
            status: transaction.status
        }));

        res.json({ data: processedTransactions });

    } catch (error) {
        console.error("Stripe API Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
