import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { docClient, PRODUCTS_TABLE, STOCK_TABLE, buildResponse } from "./dynamo.js";

interface ProductBody {
  title?: unknown;
  description?: unknown;
  price?: unknown;
  count?: unknown;
}

function validate(body: ProductBody): string | null {
  if (typeof body.title !== "string" || !body.title.trim()) {
    return "title is required and must be a non-empty string";
  }

  if (typeof body.price !== "number" || body.price <= 0) {
    return "price must be a positive number";
  }

  if (body.description !== undefined && typeof body.description !== "string") {
    return "description must be a string";
  }

  if (body.count !== undefined && (!Number.isInteger(body.count) || (body.count as number) < 0)) {
    return "count must be a non-negative integer";
  }

  return null;
}

export const handler = async (event: { body?: string | null }) => {
  console.log("createProduct event:", JSON.stringify(event));

  let body: ProductBody;
  try {
    body = JSON.parse(event.body ?? "");
  } catch {
    return buildResponse(400, { message: "Invalid JSON body" });
  }

  const validationError = validate(body);
  if (validationError) {
    return buildResponse(400, { message: validationError });
  }

  const id = uuidv4();
  const title = (body.title as string).trim();
  const description = typeof body.description === "string" ? body.description : "";
  const price = body.price as number;
  const count = typeof body.count === "number" ? (body.count as number) : 0;

  try {
    await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: PRODUCTS_TABLE,
              Item: { id, title, description, price },
            },
          },
          {
            Put: {
              TableName: STOCK_TABLE,
              Item: { product_id: id, count },
            },
          },
        ],
      }),
    );

    return buildResponse(201, { id, title, description, price, count });
  } catch (err) {
    console.error("createProduct error:", err);
    return buildResponse(500, { message: "Internal server error" });
  }
};
