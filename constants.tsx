
import React from 'react';
import { ApiEndpoint } from './types';

export const API_ENDPOINTS: ApiEndpoint[] = [
  { method: 'POST', path: '/auth/register', description: 'User registration', response: 'JWT + User Object' },
  { method: 'GET', path: '/workspaces', description: 'List user workspaces', response: 'Array<Workspace>' },
  { method: 'GET', path: '/databases/:id', description: 'Get database schema', response: 'Database with Tables' },
  { method: 'GET', path: '/tables/:id/rows', description: 'Paginated row retrieval with filters', params: '?page=1&size=100&filter[status]=active', response: '{ data: Rows[], meta: Pagination }' },
  { method: 'POST', path: '/tables/:id/rows', description: 'Create new row', response: 'Row Object' },
  { method: 'PATCH', path: '/tables/:id/rows/bulk', description: 'Bulk update rows', response: '{ updated: number }' },
  { method: 'WS', path: '/realtime', description: 'Socket.io connection for workspace collaboration', response: 'Pub/Sub Events' },
];

export const PRISMA_SCHEMA = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Workspace {
  id        String     @id @default(uuid())
  name      String
  ownerId   String
  databases Database[]
  members   User[]
  createdAt DateTime   @default(now())
}

model Database {
  id          String   @id @default(uuid())
  name        String
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  tables      Table[]
}

model Table {
  id         String   @id @default(uuid())
  name       String
  databaseId String
  database   Database @relation(fields: [databaseId], references: [id])
  fields     Field[]
  views      View[]
}

model Field {
  id        String    @id @default(uuid())
  name      String
  type      FieldType
  config    Json      // Stores specific settings like Select options or Formula string
  tableId   String
  table     Table     @relation(fields: [tableId], references: [id])
}

model Row {
  id        String   @id @default(uuid())
  tableId   String
  data      Json     // Key-Value pairs where key is Field.id
  version   Int      @default(1)
  updatedAt DateTime @updatedAt
}

enum FieldType {
  TEXT
  NUMBER
  DATE
  SINGLE_SELECT
  LINK_TO_TABLE
  FORMULA
  FILE
}

model View {
  id      String   @id @default(uuid())
  name    String
  type    ViewType
  config  Json     // Filters, sorts, column visibility
  tableId String
  table   Table    @relation(fields: [tableId], references: [id])
}

enum ViewType {
  GRID
  KANBAN
  CALENDAR
  GALLERY
}`;

export const SERVER_SETUP_CODE = `import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

// Middleware for Row-Level Security injection
app.use(async (req, res, next) => {
  const userId = req.user.id;
  // Use Prisma $executeRaw to set session local variable for Postgres RLS
  await prisma.$executeRawUnsafe(\`SET SESSION "app.current_user_id" = '\${userId}'\`);
  next();
});

io.on('connection', (socket) => {
  socket.on('join-table', (tableId) => {
    socket.join(\`table:\${tableId}\`);
  });
});

httpServer.listen(3000, () => {
  console.log('BaseForge API running on port 3000');
});`;

export const FORMULA_ENGINE_CODE = `import { evaluate } from 'mathjs';

/**
 * Server-side Formula Evaluator
 * Supports basic arithmetic and cross-row lookups
 */
export async function evaluateFormula(formula: string, rowData: any, tableFields: any[]) {
  try {
    // 1. Replace field placeholders (e.g., {Price} * {Quantity})
    let processedFormula = formula;
    tableFields.forEach(field => {
      const value = rowData[field.id] || 0;
      processedFormula = processedFormula.replace(new RegExp(\`\\{\${field.name}\\}\`, 'g'), value);
    });

    // 2. Evaluate using mathjs for safety
    return evaluate(processedFormula);
  } catch (error) {
    return '#ERROR!';
  }
}`;

export const ARCHITECTURE_DESCRIPTION = `
BaseForge follows a modern micro-services-ready monolith architecture:
1. **API Gateway (Express/Fastify)**: Handles HTTP requests, JWT validation, and schema generation.
2. **PostgreSQL + RLS**: The source of truth. Row-Level Security ensures data isolation at the database level.
3. **Redis Pub/Sub**: Handles cross-instance communication for WebSockets. When a row is updated on Server A, Server B receives a Redis message to notify its connected clients.
4. **Formula Worker**: An isolated sandbox for heavy formula computations (can be moved to a separate microservice).
5. **Storage (MinIO/S3)**: Handles file field uploads with signed URLs.
`;
