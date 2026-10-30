import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    let connection;
    try {
        // Kredensial di-hardcode langsung agar tidak bergantung pada Environment Vercel
        connection = await mysql.createConnection({
            host: 'HOST_LU_DISINI',       // Contoh: gateway01.ap-southeast-1.prod.aws.tidbcloud.com
            port: 4000,
            user: 'USER_LU_DISINI',       // Contoh: 3W...root
            password: 'PASSWORD_LU_DISINI',
            database: 'khanza',
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
                [name, Number(hpp), Number(price), Number(stock)]
            );
            await connection.end();
            return res.status(200).json({ success: true, message: 'Produk berhasil ditambahkan' });
        }

        if (action === 'add_order' && req.method === 'POST') {
            const { product_id, product_name, qty, price, hpp, awb, status } = req.body;
            await connection.execute(
                'INSERT INTO orders (product_id, product_name, qty, price, hpp, awb, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [product_id || null, product_name, Number(qty), Number(price), Number(hpp || 0), awb, status || 'Dikemas']
            );
            
            if (product_id) {
                await connection.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [Number(qty), product_id]);
            }

            await connection.end();
            return res.status(200).json({ success: true, message: 'Pesanan berhasil disimpan' });
        }

        if (connection) await connection.end();
        return res.status(400).json({ success: false, message: 'Action tidak dikenal' });

    } catch (error) {
        if (connection) {
            try { await connection.end(); } catch(e) {}
        }
        console.error("Fatal DB Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
