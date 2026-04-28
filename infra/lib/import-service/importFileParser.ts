import {
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import type { S3Event } from "aws-lambda";
import type { Readable } from "stream";
import csvParser from "csv-parser";
import {
  s3Client,
  IMPORT_BUCKET,
  UPLOADED_PREFIX,
  PARSED_PREFIX,
} from "./s3.js";

const parseStream = (stream: Readable) =>
  new Promise<void>((resolve, reject) => {
    stream
      .pipe(csvParser())
      .on("data", (record) => console.log("Parsed record:", record))
      .on("end", () => resolve())
      .on("error", reject);
  });

const moveToParsed = async (key: string) => {
  const destinationKey = key.replace(UPLOADED_PREFIX, PARSED_PREFIX);

  await s3Client.send(
    new CopyObjectCommand({
      Bucket: IMPORT_BUCKET,
      CopySource: `${IMPORT_BUCKET}/${key}`,
      Key: destinationKey,
    })
  );

  await s3Client.send(
    new DeleteObjectCommand({ Bucket: IMPORT_BUCKET, Key: key })
  );

  console.log(`Moved ${key} -> ${destinationKey}`);
};

export const handler = async (event: S3Event) => {
  console.log("importFileParser event:", JSON.stringify(event));

  for (const record of event.Records) {
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    console.log(`Processing ${key}`);

    const { Body } = await s3Client.send(
      new GetObjectCommand({ Bucket: IMPORT_BUCKET, Key: key })
    );

    await parseStream(Body as Readable);
    await moveToParsed(key);
  }
};
