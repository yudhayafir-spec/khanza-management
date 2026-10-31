import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    // Header CORS agar frontend Vercel bisa mengakses API dengan lancar
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    let connection;
    try {
        // Koneksi langsung ke TiDB Cloud dengan kredensial terbaru lu
        connection = await mysql.createConnection({
            host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
            port: 4000,
            user: '41V1NDmRAAsJj5J.root',
            password: '96eqqEAAp4QPzg8u',
            database: 'khanza',
            ssl: {
                minVersion: 'TLSv1.2',
                rejectUnauthorized: true
            }
        });

        const action = req.method === 'POST' ? req.body.action : req.query.action;

        // 1. Ambil Data Produk (Master Data)
        if (action === 'get_products') {
            const [rows] = await connection.execute('SELECT * FROM products ORDER BY id DESC');
            await connection.end();
            return res.status(200).json({ success: true, data: rows });
        }

        // 2. Ambil Data Pesanan / Transaksi
        if (action === 'get_orders') {
            const [rows] = await connection.execute('SELECT * FROM orders ORDER BY id DESC');
            await connection.end();
            return res.status(200).json({ success: true, data: rows });
        }

        // 3. Tambah Produk Baru
        if (action === 'add_product' && req.method === 'POST') {
            const { name, hpp, price, stock } = req.body;
            if (!name || hpp === undefined || price === undefined || stock === undefined) {
                await connection.end();
                return res.status(400).json({ success: false, error: 'Data produk tidak lengkap' });
            }

            await connection.execute(
                'INSERT INTO products (name, hpp, price, stock) VALUES (?, ?, ?, ?)',
                [name, Number(hpp), Number(price), Number(stock)]
            );
            await connection.end();
            return res.status(200).json({ success: true, message: 'Produk berhasil ditambahkan' });
        }

        // 4. Tambah Pesanan Baru & Potong Stok Otomatis
        if (action === 'add_order' && req.method === 'POST') {
            const { product_id, product_name, qty, price, hpp, awb, status } = req.body;
            
            await connection.execute(
                'INSERT INTO orders (product_id, product_name, qty, price, hpp, awb, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [product_id || null, product_name, Number(qty), Number(price), Number(hpp || 0), awb, status || 'Dikemas']
            );
            
            // Logika pengurangan stok produk secara otomatis
            if (product_id) {
                await connection.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [Number(qty), product_id]);
            }

            await connection.end();
            return res.status(200).json({ success: true, message: 'Pesanan berhasil disimpan' });
        }

        if (connection) await connection.end();
        return res.status(400).json({ success: false, error: 'Aksi API tidak dikenali' });

    } catch (error) {
        if (connection) {
            try { await connection.end(); } catch(e) {}
        }
        console.error("Database Error:", error);
        return res.status(500).json({ success: false, error: error.message, code: error.code || 'UNKNOWN_ERROR' });
    }
}
