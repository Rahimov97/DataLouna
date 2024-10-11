import express, { Request, Response } from 'express';
import { Pool } from 'pg';

const app = express();
const PORT = process.env.PORT || 3000;
const pool = new Pool({
    user: 'your_username',
    host: 'localhost',
    database: 'your_database',
    password: 'your_password',
    port: 5432,
});

app.use(express.json());

app.post('/purchase', async (req: Request, res: Response): Promise<void> => {
    const { userId, itemId } = req.body;

    try {
        await pool.query('BEGIN');

        const itemResult = await pool.query('SELECT price, available FROM items WHERE id = $1', [itemId]);
        const item = itemResult.rows[0];

        if (!item || !item.available) {
            res.status(400).json({ error: 'Item not available for purchase' });
            await pool.query('ROLLBACK');
            return;
        }

        const userResult = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            await pool.query('ROLLBACK');
            return;
        }

        if (user.balance < item.price) {
            res.status(400).json({ error: 'Insufficient balance' });
            await pool.query('ROLLBACK');
            return;
        }

        const newBalance = user.balance - item.price;
        await pool.query('UPDATE users SET balance = $1 WHERE id = $2', [newBalance, userId]);

        await pool.query(
            'INSERT INTO purchases (user_id, item_id, price) VALUES ($1, $2, $3)',
            [userId, itemId, item.price]
        );

        await pool.query('COMMIT');

        res.json({ message: 'Purchase successful', newBalance });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error during purchase transaction:', error);
        res.status(500).json({ error: 'Failed to complete purchase' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
