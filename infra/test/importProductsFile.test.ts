import { mockClient } from "aws-sdk-client-mock";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { handler } from "../lib/import-service/importProductsFile";

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));

const s3Mock = mockClient(S3Client);
const getSignedUrlMock = getSignedUrl as jest.Mock;

beforeEach(() => {
  s3Mock.reset();
  getSignedUrlMock.mockReset();
  getSignedUrlMock.mockResolvedValue(
    "https://signed.example/uploaded/test.csv"
  );
});

describe("importProductsFile", () => {
  it("should return 200 with the signed URL when name is provided", async () => {
    const result = await handler({
      queryStringParameters: { name: "test.csv" },
    });

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toBe(
      "https://signed.example/uploaded/test.csv"
    );
  });

  it("should call PutObjectCommand with the uploaded/ key prefix", async () => {
    await handler({ queryStringParameters: { name: "products.csv" } });

    expect(getSignedUrlMock).toHaveBeenCalledTimes(1);
    const command = getSignedUrlMock.mock.calls[0][1] as PutObjectCommand;
    expect(command.input.Bucket).toBe("import-service-bucket-test");
    expect(command.input.Key).toBe("uploaded/products.csv");
    expect(command.input.ContentType).toBe("text/csv");
  });

  it("should return 400 when name query parameter is missing", async () => {
    const result = await handler({ queryStringParameters: null });

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      message: "Query parameter 'name' is required",
    });
    expect(getSignedUrlMock).not.toHaveBeenCalled();
  });

  it("should return CORS headers", async () => {
    const result = await handler({ queryStringParameters: { name: "x.csv" } });

    expect(result.headers["Access-Control-Allow-Origin"]).toBe("*");
  });

  it("should return 500 when the presigner throws", async () => {
    getSignedUrlMock.mockRejectedValueOnce(new Error("presigner failure"));

    const result = await handler({ queryStringParameters: { name: "x.csv" } });

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      message: "Internal server error",
    });
  });
});
