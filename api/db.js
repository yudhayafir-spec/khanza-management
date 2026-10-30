connection = await mysql.createConnection({
            host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
            port: 4000,
            user: '41V1NDmRAAsJj5J.root',
            password: 'PASSWORD_BARU_LU_DISINI', // Masukin password hasil reset atau password lu
            database: 'khanza',
            ssl: {
                minVersion: 'TLSv1.2',
                rejectUnauthorized: true
            }
        });
