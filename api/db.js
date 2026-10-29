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
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT || 4000),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE || 'khanza',
            ssl: {
                minVersion: 'TLSv1.2',
                rejectUnauthorized: true
            }
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
        console.error("DB Error Detail:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
