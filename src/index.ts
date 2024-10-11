import express, { Request, Response } from 'express';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3000;
const SKINPORT_API_URL = 'https://api.skinport.com/v1/items';

const defaultAppId = '730';
const defaultCurrency = 'EUR'; 

const fetchItems = async (isTradable: boolean) => {
    const response = await axios.get(SKINPORT_API_URL, {
        params: {
            app_id: defaultAppId,
            currency: defaultCurrency,
            tradable: isTradable ? 1 : 0,
        }
    });
    return response.data;
};

app.get('/items', async (req: Request, res: Response): Promise<void> => {
    try {
        const [tradableItems, nonTradableItems] = await Promise.all([
            fetchItems(true),
            fetchItems(false)
        ]);

        const itemsMap: { [key: string]: any } = {};

        tradableItems.forEach((item: any) => {
            itemsMap[item.market_hash_name] = {
                market_hash_name: item.market_hash_name,
                currency: item.currency,
                suggested_price: item.suggested_price,
                item_page: item.item_page,
                market_page: item.market_page,
                tradable_min_price: item.min_price,
                non_tradable_min_price: null,
                max_price: item.max_price,
                mean_price: item.mean_price,
                quantity: item.quantity,
                created_at: item.created_at,
                updated_at: item.updated_at
            };
        });

        nonTradableItems.forEach((item: any) => {
            if (itemsMap[item.market_hash_name]) {
                itemsMap[item.market_hash_name].non_tradable_min_price = item.min_price;
            } else {
                itemsMap[item.market_hash_name] = {
                    market_hash_name: item.market_hash_name,
                    currency: item.currency,
                    suggested_price: item.suggested_price,
                    item_page: item.item_page,
                    market_page: item.market_page,
                    tradable_min_price: null, 
                    non_tradable_min_price: item.min_price,
                    max_price: item.max_price,
                    mean_price: item.mean_price,
                    quantity: item.quantity,
                    created_at: item.created_at,
                    updated_at: item.updated_at
                };
            }
        });

        const result = Object.values(itemsMap);

        res.json(result);
    } catch (error) {
        console.error('Error fetching items from Skinport API:', error);
        res.status(500).json({ error: 'Failed to fetch items from Skinport API' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
