import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { products } from "../lib/product-service/products";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE ?? "products";
const STOCK_TABLE = process.env.STOCK_TABLE ?? "stock";

const client = new DynamoDBClient({ region: process.env.AWS_REGION ?? "eu-west-1" });
const docClient = DynamoDBDocumentClient.from(client);

async function seed() {
  console.log(`Seeding table "${PRODUCTS_TABLE}" with ${products.length} products...`);

  const productsResult = await docClient.send(
    new BatchWriteCommand({
      RequestItems: {
        [PRODUCTS_TABLE]: products.map(({ id, title, description, price }) => ({
          PutRequest: { Item: { id, title, description, price } },
        })),
      },
    }),
  );

  if (Object.keys(productsResult.UnprocessedItems ?? {}).length > 0) {
    console.error("Unprocessed products items:", productsResult.UnprocessedItems);
    process.exit(1);
  }

  console.log(`Seeding table "${STOCK_TABLE}" with ${products.length} stock items...`);

  const stockResult = await docClient.send(
    new BatchWriteCommand({
      RequestItems: {
        [STOCK_TABLE]: products.map(({ id, count }) => ({
          PutRequest: { Item: { product_id: id, count } },
        })),
      },
    }),
  );

  if (Object.keys(stockResult.UnprocessedItems ?? {}).length > 0) {
    console.error("Unprocessed stock items:", stockResult.UnprocessedItems);
    process.exit(1);
  }

  console.log("Seed successfully completed.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
