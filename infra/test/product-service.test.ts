import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { handler as getProductsListHandler } from "../lib/product-service/getProductsList";
import { handler as getProductsByIdHandler } from "../lib/product-service/getProductsById";

const ddbMock = mockClient(DynamoDBDocumentClient);

const mockProducts = [
  { id: "1", title: "MacBook Pro", description: "Apple laptop", price: 2499 },
  { id: "2", title: "Dell XPS", description: "Dell laptop", price: 1799 },
];

const mockStock = [
  { product_id: "1", count: 8 },
  { product_id: "2", count: 12 },
];

beforeEach(() => {
  ddbMock.reset();
});

describe("getProductsList", () => {
  it("should return 200 with joined products", async () => {
    ddbMock
      .on(ScanCommand, { TableName: "products" })
      .resolves({ Items: mockProducts })
      .on(ScanCommand, { TableName: "stock" })
      .resolves({ Items: mockStock });

    const result = await getProductsListHandler({});

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toHaveLength(2);
    expect(body[0]).toEqual({ id: "1", title: "MacBook Pro", description: "Apple laptop", price: 2499, count: 8 });
    expect(body[1]).toEqual({ id: "2", title: "Dell XPS", description: "Dell laptop", price: 1799, count: 12 });
  });

  it("should return CORS headers", async () => {
    ddbMock.on(ScanCommand).resolves({ Items: [] });

    const result = await getProductsListHandler({});

    expect(result.headers["Access-Control-Allow-Origin"]).toBe("*");
  });

  it("should return count 0 when stock item is missing", async () => {
    ddbMock
      .on(ScanCommand, { TableName: "products" })
      .resolves({ Items: [mockProducts[0]] })
      .on(ScanCommand, { TableName: "stock" })
      .resolves({ Items: [] });

    const result = await getProductsListHandler({});
    const body = JSON.parse(result.body);

    expect(body[0].count).toBe(0);
  });

  it("should return 500 on DynamoDB error", async () => {
    ddbMock.on(ScanCommand).rejects(new Error("DynamoDB connection error"));

    const result = await getProductsListHandler({});

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({ message: "Internal server error" });
  });
});

describe("getProductsById", () => {
  it("should return 200 with merged product", async () => {
    ddbMock
      .on(GetCommand, { TableName: "products", Key: { id: "1" } })
      .resolves({ Item: mockProducts[0] })
      .on(GetCommand, { TableName: "stock", Key: { product_id: "1" } })
      .resolves({ Item: mockStock[0] });

    const result = await getProductsByIdHandler({ pathParameters: { productId: "1" } });

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({
      id: "1",
      title: "MacBook Pro",
      description: "Apple laptop",
      price: 2499,
      count: 8,
    });
  });

  it("should return 404 when product is not found", async () => {
    ddbMock.on(GetCommand).resolves({ Item: undefined });

    const result = await getProductsByIdHandler({ pathParameters: { productId: "non-existent-id" } });

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({ message: "Product not found" });
  });

  it("should return 400 when productId is missing", async () => {
    const result = await getProductsByIdHandler({ pathParameters: null });

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({ message: "Product ID is required" });
  });

  it("should return CORS headers", async () => {
    ddbMock
      .on(GetCommand, { TableName: "products" })
      .resolves({ Item: mockProducts[0] })
      .on(GetCommand, { TableName: "stock" })
      .resolves({ Item: mockStock[0] });

    const result = await getProductsByIdHandler({ pathParameters: { productId: "1" } });

    expect(result.headers["Access-Control-Allow-Origin"]).toBe("*");
  });

  it("should return 500 on DynamoDB error", async () => {
    ddbMock.on(GetCommand).rejects(new Error("DynamoDB connection error"));

    const result = await getProductsByIdHandler({ pathParameters: { productId: "1" } });

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({ message: "Internal server error" });
  });
});
