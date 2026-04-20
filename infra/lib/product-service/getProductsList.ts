import { products } from "./products.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET",
};

export const handler = async () => {
  console.log("getProductsList invoked");

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(products),
  };
};
