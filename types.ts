
export type FieldType = 'TEXT' | 'STATUS' | 'DATE' | 'USER' | 'NUMBER';

export interface Field {
  id: string;
  name: string;
  type: FieldType;
  options?: string[]; // For STATUS type
}

export interface Row {
  id: string;
  [fieldId: string]: any;
}

export interface Table {
  id: string;
  name: string;
  fields: Field[];
  rows: Row[];
}

export interface ViewDefinition {
  id: string;
  name: string;
  type: 'TABLE' | 'KANBAN' | 'GANTT';
  config?: any;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'WS';
  path: string;
  description: string;
  params?: string;
  response: string;
}

export interface SpecSection {
  id: string;
  title: string;
  icon: string;
  category: 'APP' | 'SYSTEM';
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export type DbType = 'POSTGRES' | 'MONGODB' | 'SQLITE';

export interface DataSource {
  id: string;
  name: string;
  type: DbType;
  connectionString: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  lastSync?: number;
}
