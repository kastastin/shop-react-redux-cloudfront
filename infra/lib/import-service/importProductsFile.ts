import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  s3Client,
  IMPORT_BUCKET,
  UPLOADED_PREFIX,
  buildResponse,
} from "./s3.js";

const SIGNED_URL_TTL_SECONDS = 60;

type LambdaEvent = { queryStringParameters?: { name?: string } | null };

export const handler = async (event: LambdaEvent) => {
  console.log("importProductsFile event:", JSON.stringify(event));

  try {
    const fileName = event.queryStringParameters?.name;
    if (!fileName) {
      return buildResponse(400, {
        message: "Query parameter 'name' is required",
      });
    }

    const command = new PutObjectCommand({
      Bucket: IMPORT_BUCKET,
      Key: `${UPLOADED_PREFIX}${fileName}`,
      ContentType: "text/csv",
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: SIGNED_URL_TTL_SECONDS,
    });

    return buildResponse(200, signedUrl);
  } catch (err) {
    console.error("importProductsFile error:", err);
    return buildResponse(500, { message: "Internal server error" });
  }
};
