import { v4 as uuidv4 } from "uuid";
import { PublishCommand } from "@aws-sdk/client-sns";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import type { SQSEvent, SQSRecord } from "aws-lambda";
import { docClient, PRODUCTS_TABLE, STOCK_TABLE } from "./dynamo.js";
import { snsClient, CREATE_PRODUCT_TOPIC_ARN } from "./sns.js";

interface CreatedProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number;
}

const parseRecord = (record: SQSRecord): CreatedProduct | null => {
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(record.body) as Record<string, unknown>;
  } catch {
    console.error("catalogBatchProcess invalid JSON:", record.body);
    return null;
  }

  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) {
    console.error("catalogBatchProcess missing title:", raw);
    return null;
  }

  const price = Number(raw.price);
  if (!Number.isFinite(price) || price <= 0) {
    console.error("catalogBatchProcess invalid price:", raw);
    return null;
  }

  const description =
    typeof raw.description === "string" ? raw.description : "";

  const countValue =
    raw.count === undefined || raw.count === "" ? 0 : Number(raw.count);
  if (!Number.isInteger(countValue) || countValue < 0) {
    console.error("catalogBatchProcess invalid count:", raw);
    return null;
  }

  return { id: uuidv4(), title, description, price, count: countValue };
};

const writeProduct = async (product: CreatedProduct) => {
  await docClient.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: PRODUCTS_TABLE,
            Item: {
              id: product.id,
              title: product.title,
              description: product.description,
              price: product.price,
            },
          },
        },
        {
          Put: {
            TableName: STOCK_TABLE,
            Item: { product_id: product.id, count: product.count },
          },
        },
      ],
    })
  );
};

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log("catalogBatchProcess event:", JSON.stringify(event));

  const created: CreatedProduct[] = [];

  for (const record of event.Records) {
    const product = parseRecord(record);
    if (!product) continue;

    try {
      await writeProduct(product);
      created.push(product);
    } catch (err) {
      console.error(
        "catalogBatchProcess write error:",
        err,
        "product:",
        product
      );
    }
  }

  if (created.length === 0) {
    console.log("catalogBatchProcess created 0 products, skipping SNS publish");
    return;
  }

  const totalCount = created.reduce((sum, p) => sum + p.count, 0);

  await snsClient.send(
    new PublishCommand({
      TopicArn: CREATE_PRODUCT_TOPIC_ARN,
      Subject: "Products created",
      Message: JSON.stringify({ created, totalCount }),
      MessageAttributes: {
        count: { DataType: "Number", StringValue: String(totalCount) },
      },
    })
  );

  console.log(
    `catalogBatchProcess created ${created.length} products, totalCount=${totalCount}`
  );
};
