import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

const fixIndex = async () => {
    try {
        await mongoose.connect(DATABASE_URL);
        console.log('Connected to DB.');

        const db = mongoose.connection.db;
        const collection = db.collection('blogs');

        console.log('Dropping externalId_1 index...');
        try {
            await collection.dropIndex('externalId_1');
            console.log('Index dropped.');
        } catch (e) {
            console.log('Index does not exist or already dropped.');
        }

        console.log('Recreating externalId_1 index with sparse: true...');
        await collection.createIndex({ externalId: 1 }, { unique: true, sparse: true });
        console.log('Index recreated successfully.');

        process.exit(0);
    } catch (err) {
        console.error('Fix failed:', err.message);
        process.exit(1);
    }
};

fixIndex();
