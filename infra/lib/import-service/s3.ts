import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({ region: process.env.AWS_REGION });

export const IMPORT_BUCKET = process.env.IMPORT_BUCKET as string;
export const UPLOADED_PREFIX = "uploaded/";
export const PARSED_PREFIX = "parsed/";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

export const buildResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify(body),
});
