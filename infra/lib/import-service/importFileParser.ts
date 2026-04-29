import {
  s3Client,
  IMPORT_BUCKET,
  UPLOADED_PREFIX,
  PARSED_PREFIX,
} from "./s3.js";
import {
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import type { S3Event } from "aws-lambda";
import type { Readable } from "stream";
import csvParser from "csv-parser";

const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
const CATALOG_ITEMS_QUEUE_URL = process.env.CATALOG_ITEMS_QUEUE_URL as string;

const sendRecord = (record: unknown) =>
  sqsClient.send(
    new SendMessageCommand({
      QueueUrl: CATALOG_ITEMS_QUEUE_URL,
      MessageBody: JSON.stringify(record),
    })
  );

const parseStream = (stream: Readable) =>
  new Promise<number>((resolve, reject) => {
    const pending: Promise<unknown>[] = [];
    stream
      .pipe(csvParser())
      .on("data", (record) => {
        pending.push(sendRecord(record));
      })
      .on("end", () => {
        Promise.all(pending)
          .then(() => resolve(pending.length))
          .catch(reject);
      })
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

    const sent = await parseStream(Body as Readable);
    console.log(`Sent ${sent} records to SQS for ${key}`);

    await moveToParsed(key);
  }
};
