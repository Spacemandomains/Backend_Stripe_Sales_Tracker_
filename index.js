require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

async function fetchAllTransactions(limit = 50) {
    let allTransactions = [];
    let hasMore = true;
    let lastTransactionId = null;

    while (hasMore) {
        try {
            // ✅ Build request parameters dynamically
            let params = { limit: limit };
            if (lastTransactionId) {
                params.starting_after = lastTransactionId; // ✅ Only add if there's a previous transaction
            }

            // ✅ Fetch transactions from Stripe
            const transactions = await stripe.paymentIntents.list(params);

            console.log(`Fetched ${transactions.data.length} transactions`);

            if (!transactions || !transactions.data) {
                throw new Error("No transactions found");
            }

            // ✅ Filter only successful transactions
            const successfulTransactions = transactions.data.filter(transaction => transaction.status === "succeeded");

            allTransactions.push(...successfulTransactions);

            // ✅ Check if there are more transactions to fetch
            hasMore = transactions.has_more;
            if (hasMore) {
                lastTransactionId = transactions.data[transactions.data.length - 1].id;
            }
        } catch (error) {
            console.error("Stripe API Error:", error.message);
            break;
        }
    }

    return allTransactions;
}

app.get('/sales', async (req, res) => {
    try {
        console.log("Fetching all donation transactions from Stripe...");

        // ✅ Fetch all successful donations
        const transactions = await fetchAllTransactions();

        // ✅ Format transactions for frontend
        const processedTransactions = transactions.map(transaction => ({
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
