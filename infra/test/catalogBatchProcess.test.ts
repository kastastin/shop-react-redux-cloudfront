import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import type { SQSEvent, SQSRecord } from "aws-lambda";
import { handler } from "../lib/product-service/catalogBatchProcess";

const ddbMock = mockClient(DynamoDBDocumentClient);
const snsMock = mockClient(SNSClient);

const buildRecord = (body: unknown): SQSRecord =>
  ({
    body: typeof body === "string" ? body : JSON.stringify(body),
  } as SQSRecord);

const buildEvent = (records: SQSRecord[]): SQSEvent =>
  ({ Records: records } as SQSEvent);

beforeEach(() => {
  ddbMock.reset();
  snsMock.reset();
  ddbMock.on(TransactWriteCommand).resolves({});
  snsMock.on(PublishCommand).resolves({ MessageId: "test-message-id" });
});

describe("catalogBatchProcess", () => {
  it("writes each valid record and publishes a single SNS message", async () => {
    await handler(
      buildEvent([
        buildRecord({
          title: "Phone",
          description: "Smartphone",
          price: 599,
          count: 3,
        }),
        buildRecord({
          title: "Tablet",
          description: "Tablet device",
          price: 299,
          count: 4,
        }),
      ])
    );

    expect(ddbMock.commandCalls(TransactWriteCommand)).toHaveLength(2);
    expect(snsMock.commandCalls(PublishCommand)).toHaveLength(1);

    const publishInput = snsMock.commandCalls(PublishCommand)[0].args[0].input;
    const message = JSON.parse(publishInput.Message as string);
    expect(message.created).toHaveLength(2);
    expect(message.totalCount).toBe(7);
    expect(publishInput.MessageAttributes?.count).toEqual({
      DataType: "Number",
      StringValue: "7",
    });
  });

  it("coerces CSV-style numeric strings to numbers", async () => {
    await handler(
      buildEvent([
        buildRecord({ title: "Headphones", price: "129", count: "12" }),
      ])
    );

    expect(ddbMock.commandCalls(TransactWriteCommand)).toHaveLength(1);
    const txInput = ddbMock.commandCalls(TransactWriteCommand)[0].args[0].input;
    const productItem = txInput.TransactItems?.[0]?.Put?.Item;
    const stockItem = txInput.TransactItems?.[1]?.Put?.Item;
    expect(productItem?.price).toBe(129);
    expect(stockItem?.count).toBe(12);
  });

  it("skips invalid records but still publishes valid ones", async () => {
    await handler(
      buildEvent([
        buildRecord({ title: "Valid", price: 100 }),
        buildRecord({ price: 200 }), // missing title
        buildRecord({ title: "BadPrice", price: -1 }),
        buildRecord("not-json"),
      ])
    );

    expect(ddbMock.commandCalls(TransactWriteCommand)).toHaveLength(1);
    expect(snsMock.commandCalls(PublishCommand)).toHaveLength(1);

    const publishInput = snsMock.commandCalls(PublishCommand)[0].args[0].input;
    const message = JSON.parse(publishInput.Message as string);
    expect(message.created).toHaveLength(1);
    expect(message.created[0].title).toBe("Valid");
  });

  it("does not publish when nothing is created", async () => {
    await handler(
      buildEvent([buildRecord({ price: 200 }), buildRecord("not-json")])
    );

    expect(ddbMock.commandCalls(TransactWriteCommand)).toHaveLength(0);
    expect(snsMock.commandCalls(PublishCommand)).toHaveLength(0);
  });

  it("continues processing the batch when one DynamoDB write fails", async () => {
    let call = 0;
    ddbMock.on(TransactWriteCommand).callsFake(() => {
      call += 1;
      if (call === 1) throw new Error("Conditional check failed");
      return {};
    });

    await handler(
      buildEvent([
        buildRecord({ title: "Will fail", price: 10, count: 1 }),
        buildRecord({ title: "Will succeed", price: 20, count: 2 }),
      ])
    );

    expect(ddbMock.commandCalls(TransactWriteCommand)).toHaveLength(2);
    expect(snsMock.commandCalls(PublishCommand)).toHaveLength(1);
    const message = JSON.parse(
      snsMock.commandCalls(PublishCommand)[0].args[0].input.Message as string
    );
    expect(message.created).toHaveLength(1);
    expect(message.created[0].title).toBe("Will succeed");
    expect(message.totalCount).toBe(2);
  });

  it("rejects records with non-integer count", async () => {
    await handler(
      buildEvent([buildRecord({ title: "Bad", price: 10, count: 1.5 })])
    );

    expect(ddbMock.commandCalls(TransactWriteCommand)).toHaveLength(0);
    expect(snsMock.commandCalls(PublishCommand)).toHaveLength(0);
  });

  it("defaults count to 0 and description to empty string when omitted", async () => {
    await handler(buildEvent([buildRecord({ title: "Minimal", price: 50 })]));

    const txInput = ddbMock.commandCalls(TransactWriteCommand)[0].args[0].input;
    const productItem = txInput.TransactItems?.[0]?.Put?.Item;
    const stockItem = txInput.TransactItems?.[1]?.Put?.Item;
    expect(productItem?.description).toBe("");
    expect(stockItem?.count).toBe(0);

    const message = JSON.parse(
      snsMock.commandCalls(PublishCommand)[0].args[0].input.Message as string
    );
    expect(message.totalCount).toBe(0);

    const attrCount =
      snsMock.commandCalls(PublishCommand)[0].args[0].input.MessageAttributes
        ?.count;
    expect(attrCount).toEqual({ DataType: "Number", StringValue: "0" });
  });
});
