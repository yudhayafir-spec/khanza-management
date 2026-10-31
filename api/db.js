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
