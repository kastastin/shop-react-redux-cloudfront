import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, PRODUCTS_TABLE, STOCK_TABLE, buildResponse } from "./dynamo.js";

export const handler = async (event: unknown) => {
  console.log("getProductsList event:", JSON.stringify(event));

  try {
    const [productsResult, stockResult] = await Promise.all([
      docClient.send(new ScanCommand({ TableName: PRODUCTS_TABLE })),
      docClient.send(new ScanCommand({ TableName: STOCK_TABLE })),
    ]);

    const stockMap = new Map(
      (stockResult.Items ?? []).map((item) => [item.product_id as string, item.count as number]),
    );

    const products = (productsResult.Items ?? []).map((item) => ({
      id: item.id as string,
      title: item.title as string,
      description: item.description as string,
      price: item.price as number,
      count: stockMap.get(item.id as string) ?? 0,
    }));

    return buildResponse(200, products);
  } catch (err) {
    console.error("getProductsList error:", err);
    return buildResponse(500, { message: "Internal server error" });
  }
};
