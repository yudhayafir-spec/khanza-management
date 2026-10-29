import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const connection = await mysql.createConnection({
            host: process.env.TIDB_HOST,
            port: process.env.TIDB_PORT || 4000,
            user: process.env.TIDB_USER,
            password: process.env.TIDB_PASSWORD,
            database: process.env.TIDB_DATABASE,
            ssl: { rejectUnauthorized: true }
        });

        const action = req.method === 'POST' ? req.body.action : req.query.action;

        if (action === 'get_products') {
            const [rows] = await connection.execute('SELECT * FROM products');
            await connection.end();
            return res.status(200).json({ success: true, data: rows });
        }

        if (action === 'get_orders') {
            const [rows] = await connection.execute('SELECT * FROM orders');
            await connection.end();
            return res.status(200).json({ success: true, data: rows });
        }

        if (action === 'add_product' && req.method === 'POST') {
            const { name, hpp, price, stock } = req.body;
            await connection.execute(
                'INSERT INTO products (name, hpp, price, stock) VALUES (?, ?, ?, ?)',
                [name, hpp, price, stock]
            );
            await connection.end();
            return res.status(200).json({ success: true, message: 'Produk berhasil ditambahkan' });
        }

        if (action === 'add_order' && req.method === 'POST') {
            const { product_id, product_name, qty, price, hpp, awb, status } = req.body;
            await connection.execute(
                'INSERT INTO orders (product_id, product_name, qty, price, hpp, awb, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [product_id || 1, product_name, qty, price, hpp, awb, status || 'Dikemas']
            );
            
            if(product_id) {
                await connection.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [qty, product_id]);
            }

            await connection.end();
            return res.status(200).json({ success: true, message: 'Pesanan berhasil disimpan' });
        }

        await connection.end();
        return res.status(400).json({ success: false, message: 'Action tidak dikenal' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
