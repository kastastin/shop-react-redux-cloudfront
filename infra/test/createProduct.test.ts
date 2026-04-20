import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { handler } from "../lib/product-service/createProduct";

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => {
  ddbMock.reset();
});

describe("createProduct", () => {
  it("should return 201 with created product on valid input", async () => {
    ddbMock.on(TransactWriteCommand).resolves({});

    const event = {
      body: JSON.stringify({ title: "New Laptop", description: "Great laptop", price: 1200, count: 5 }),
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.id).toBeDefined();
    expect(body.title).toBe("New Laptop");
    expect(body.description).toBe("Great laptop");
    expect(body.price).toBe(1200);
    expect(body.count).toBe(5);
  });

  it("should return 201 with default count 0 when count is omitted", async () => {
    ddbMock.on(TransactWriteCommand).resolves({});

    const result = await handler({
      body: JSON.stringify({ title: "Laptop", price: 999 }),
    });

    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body).count).toBe(0);
  });

  it("should return 400 when title is missing", async () => {
    const result = await handler({
      body: JSON.stringify({ price: 999 }),
    });

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toContain("title");
  });

  it("should return 400 when title is empty string", async () => {
    const result = await handler({
      body: JSON.stringify({ title: "  ", price: 999 }),
    });

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toContain("title");
  });

  it("should return 400 when price is not a positive number", async () => {
    const result = await handler({
      body: JSON.stringify({ title: "Laptop", price: -10 }),
    });

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toContain("price");
  });

  it("should return 400 when price is zero", async () => {
    const result = await handler({
      body: JSON.stringify({ title: "Laptop", price: 0 }),
    });

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toContain("price");
  });

  it("should return 400 when count is a negative integer", async () => {
    const result = await handler({
      body: JSON.stringify({ title: "Laptop", price: 999, count: -1 }),
    });

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toContain("count");
  });

  it("should return 400 when count is a float", async () => {
    const result = await handler({
      body: JSON.stringify({ title: "Laptop", price: 999, count: 1.5 }),
    });

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toContain("count");
  });

  it("should return 400 when body is invalid JSON", async () => {
    const result = await handler({ body: "not-json" });

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toContain("Invalid JSON");
  });

  it("should return 500 when DynamoDB throws", async () => {
    ddbMock.on(TransactWriteCommand).rejects(new Error("DynamoDB error"));

    const result = await handler({
      body: JSON.stringify({ title: "Laptop", price: 999 }),
    });

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({ message: "Internal server error" });
  });

  it("should return CORS headers", async () => {
    ddbMock.on(TransactWriteCommand).resolves({});

    const result = await handler({
      body: JSON.stringify({ title: "Laptop", price: 999 }),
    });

    expect(result.headers["Access-Control-Allow-Origin"]).toBe("*");
  });
});
