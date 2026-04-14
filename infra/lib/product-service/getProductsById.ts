import { products } from "./products.js";

interface LambdaEvent {
  pathParameters?: Record<string, string | undefined> | null;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET",
};

export const handler = async (event: LambdaEvent) => {
  const productId = event.pathParameters?.productId;

  console.log(`getProductsById invoked with productId: ${productId}`);

  if (!productId) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: "Product ID is required" }),
    };
  }

  const product = products.find((p) => p.id === productId);

  if (!product) {
    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: "Product not found" }),
    };
  }

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(product),
  };
};
