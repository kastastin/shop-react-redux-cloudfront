import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, PRODUCTS_TABLE, STOCK_TABLE, buildResponse } from "./dynamo.js";

interface LambdaEvent {
  pathParameters?: Record<string, string | undefined> | null;
}

export const handler = async (event: LambdaEvent) => {
  console.log("getProductsById event:", JSON.stringify(event));

  const productId = event.pathParameters?.productId;
  if (!productId) {
    return buildResponse(400, { message: "Product ID is required" });
  }

  try {
    const [productResult, stockResult] = await Promise.all([
      docClient.send(new GetCommand({ TableName: PRODUCTS_TABLE, Key: { id: productId } })),
      docClient.send(new GetCommand({ TableName: STOCK_TABLE, Key: { product_id: productId } })),
    ]);

    if (!productResult.Item) {
      return buildResponse(404, { message: "Product not found" });
    }

    const product = {
      id: productResult.Item.id as string,
      title: productResult.Item.title as string,
      description: productResult.Item.description as string,
      price: productResult.Item.price as number,
      count: (stockResult.Item?.count as number) ?? 0,
    };

    return buildResponse(200, product);
  } catch (err) {
    console.error("getProductsById error:", err);
    return buildResponse(500, { message: "Internal server error" });
  }
};
