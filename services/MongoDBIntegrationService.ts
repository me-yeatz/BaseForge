// MongoDB Integration Service for BaseForge
// This service handles communication with a backend API that manages MongoDB connections

interface MongoConfig {
  connectionString: string;
  databaseName: string;
}

interface SyncResult {
  success: boolean;
  message: string;
  recordsSynced?: number;
}

class MongoDBIntegrationService {
  private baseUrl: string;

  constructor() {
    // In a real implementation, this would be your backend API endpoint
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }

  // Test MongoDB connection
  async testConnection(config: MongoConfig): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/mongodb/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error testing MongoDB connection:', error);
      return false;
    }
  }

  // Get list of databases from MongoDB
  async getDatabases(config: MongoConfig): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/mongodb/databases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const result = await response.json();
      return result.databases || [];
    } catch (error) {
      console.error('Error fetching MongoDB databases:', error);
      return [];
    }
  }

  // Get collections in a specific database
  async getCollections(config: MongoConfig, databaseName: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/mongodb/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...config, databaseName }),
      });

      const result = await response.json();
      return result.collections || [];
    } catch (error) {
      console.error('Error fetching MongoDB collections:', error);
      return [];
    }
  }

  // Sync BaseForge table to MongoDB collection
  async syncTableToMongoDB(
    tableName: string, 
    tableData: any[], 
    config: MongoConfig, 
    collectionName: string
  ): Promise<SyncResult> {
    try {
      const response = await fetch(`${this.baseUrl}/mongodb/sync-to-mongo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          tableName,
          collectionName,
          data: tableData,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error syncing table to MongoDB:', error);
      return {
        success: false,
        message: 'Failed to sync data to MongoDB',
      };
    }
  }

  // Sync MongoDB collection to BaseForge table
  async syncMongoDBToTable(
    config: MongoConfig, 
    databaseName: string, 
    collectionName: string
  ): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/mongodb/sync-to-table`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          databaseName,
          collectionName,
        }),
      });

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error syncing MongoDB to table:', error);
      return [];
    }
  }

  // Get MongoDB document count for a collection
  async getDocumentCount(config: MongoConfig, databaseName: string, collectionName: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/mongodb/count`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          databaseName,
          collectionName,
        }),
      });

      const result = await response.json();
      return result.count || 0;
    } catch (error) {
      console.error('Error getting document count:', error);
      return 0;
    }
  }
}

// Singleton instance
export const mongoDBIntegrationService = new MongoDBIntegrationService();

// Export for use in the app
export default MongoDBIntegrationService;