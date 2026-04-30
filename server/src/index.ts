import express from 'express';
import {prisma} from '../lib/prisma';
const app = express();
const PORT = process.env.PORT || 3000;

const main = async () => {
    await prisma.$connect();
    console.log('Connected to the database');
    
    
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

main()