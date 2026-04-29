import { SNSClient } from "@aws-sdk/client-sns";

export const snsClient = new SNSClient({ region: process.env.AWS_REGION });

export const CREATE_PRODUCT_TOPIC_ARN = process.env
  .CREATE_PRODUCT_TOPIC_ARN as string;
