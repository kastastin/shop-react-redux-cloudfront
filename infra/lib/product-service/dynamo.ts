import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
export const docClient = DynamoDBDocumentClient.from(client);

export const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE as string;
export const STOCK_TABLE = process.env.STOCK_TABLE as string;

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

export const buildResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify(body),
});
