import { MongoClient, Collection } from 'mongodb';
import { config } from '../config';

const client = new MongoClient(config.MONGODB_URI);
const db = client.db(config.MONGODB_DB_NAME);

export const walletAddressesCollection: Collection<{ id: string; address: string }> = db.collection('wallet_addresses');

// Ensure indexes
walletAddressesCollection.createIndex({ id: 1 }, { unique: true }); 