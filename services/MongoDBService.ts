import { MongoClient, Db } from 'mongodb';

interface MongoConfig {
  connectionString: string;
  databaseName: string;
}

class MongoDBService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;

  async connect(config: MongoConfig): Promise<void> {
    try {
      this.client = new MongoClient(config.connectionString);
      await this.client.connect();
      this.db = this.client.db(config.databaseName);
      this.isConnected = true;
      console.log(`Connected to MongoDB: ${config.databaseName}`);
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.db) {
        throw new Error('Not connected to MongoDB');
      }
      await this.db.admin().ping();
      return true;
    } catch (error) {
      console.error('MongoDB test connection error:', error);
      return false;
    }
  }

  async getDatabases(): Promise<string[]> {
    if (!this.db) {
      throw new Error('Not connected to MongoDB');
    }
    
    const adminDb = this.client?.db().admin();
    const result = await adminDb?.listDatabases();
    return result?.databases?.map((db: any) => db.name) || [];
  }

  async getCollections(databaseName: string): Promise<string[]> {
    if (!this.db) {
      throw new Error('Not connected to MongoDB');
    }
    
    const db = this.client?.db(databaseName);
    const collections = await db?.listCollections().toArray();
    return collections?.map(col => col.name) || [];
  }

  async getCollectionData(databaseName: string, collectionName: string): Promise<any[]> {
    if (!this.db) {
      throw new Error('Not connected to MongoDB');
    }
    
    const db = this.client?.db(databaseName);
    const collection = db?.collection(collectionName);
    return await collection?.find({}).toArray() || [];
  }

  async syncTableToCollection(tableName: string, data: any[], databaseName: string, collectionName: string): Promise<void> {
    if (!this.db) {
      throw new Error('Not connected to MongoDB');
    }
    
    const db = this.client?.db(databaseName);
    const collection = db?.collection(collectionName);
    
    // Clear existing data and insert new data
    await collection?.deleteMany({});
    if (data.length > 0) {
      await collection?.insertMany(data);
    }
  }

  async syncCollectionToTable(databaseName: string, collectionName: string): Promise<any[]> {
    if (!this.db) {
      throw new Error('Not connected to MongoDB');
    }
    
    const db = this.client?.db(databaseName);
    const collection = db?.collection(collectionName);
    return await collection?.find({}).toArray() || [];
  }
}

// Singleton instance
export const mongoDBService = new MongoDBService();

// Export for use in the app
export default MongoDBService;