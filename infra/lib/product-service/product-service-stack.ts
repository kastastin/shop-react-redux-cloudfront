import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as snsSubscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as cdk from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";

const NOTIFICATION_EMAIL = "kostya242421@gmail.com";
const FILTER_EMAIL = "kostya242421+bigbatch@gmail.com";
const BIG_BATCH_THRESHOLD = 5;

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = new dynamodb.Table(this, "ProductsTable", {
      tableName: "products",
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const stockTable = new dynamodb.Table(this, "StockTable", {
      tableName: "stock",
      partitionKey: { name: "product_id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const catalogItemsQueue = new sqs.Queue(this, "CatalogItemsQueue", {
      queueName: "catalogItemsQueue",
    });

    const createProductTopic = new sns.Topic(this, "CreateProductTopic", {
      topicName: "createProductTopic",
    });

    createProductTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(NOTIFICATION_EMAIL)
    );

    createProductTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(FILTER_EMAIL, {
        filterPolicy: {
          count: sns.SubscriptionFilter.numericFilter({
            greaterThan: BIG_BATCH_THRESHOLD,
          }),
        },
      })
    );

    const commonLambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      code: lambda.Code.fromAsset(path.join(__dirname, "./")),
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCK_TABLE: stockTable.tableName,
      },
    };

    const getProductsList = new lambda.Function(
      this,
      "GetProductsListHandler",
      {
        ...commonLambdaProps,
        handler: "getProductsList.handler",
      }
    );

    const getProductsById = new lambda.Function(
      this,
      "GetProductsByIdHandler",
      {
        ...commonLambdaProps,
        handler: "getProductsById.handler",
      }
    );

    const createProduct = new lambda.Function(this, "CreateProductHandler", {
      ...commonLambdaProps,
      handler: "createProduct.handler",
    });

    const catalogBatchProcess = new lambdaNodejs.NodejsFunction(
      this,
      "CatalogBatchProcessHandler",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        entry: path.join(__dirname, "catalogBatchProcess.ts"),
        handler: "handler",
        environment: {
          ...commonLambdaProps.environment,
          CREATE_PRODUCT_TOPIC_ARN: createProductTopic.topicArn,
        },
        bundling: { minify: false, sourceMap: false },
      }
    );

    catalogBatchProcess.addEventSource(
      new SqsEventSource(catalogItemsQueue, { batchSize: 5 })
    );

    productsTable.grantReadData(getProductsList);
    stockTable.grantReadData(getProductsList);

    productsTable.grantReadData(getProductsById);
    stockTable.grantReadData(getProductsById);

    productsTable.grantWriteData(createProduct);
    stockTable.grantWriteData(createProduct);

    productsTable.grantWriteData(catalogBatchProcess);
    stockTable.grantWriteData(catalogBatchProcess);
    createProductTopic.grantPublish(catalogBatchProcess);

    const api = new apigateway.RestApi(this, "ProductServiceApi", {
      restApiName: "Product Service API",
      description: "This API serves the Product Service Lambda functions.",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    const productsResource = api.root.addResource("products");
    productsResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsList)
    );
    productsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createProduct)
    );

    const productByIdResource = productsResource.addResource("{productId}");
    productByIdResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsById)
    );

    new cdk.CfnOutput(this, "ProductServiceApiUrl", {
      value: api.url,
      description: "Product Service API Gateway URL",
      exportName: "ProductServiceApiUrl",
    });

    new cdk.CfnOutput(this, "ProductsTableName", {
      value: productsTable.tableName,
      description: "Products DynamoDB Table Name",
    });

    new cdk.CfnOutput(this, "StockTableName", {
      value: stockTable.tableName,
      description: "Stock DynamoDB Table Name",
    });

    new cdk.CfnOutput(this, "CatalogItemsQueueUrl", {
      value: catalogItemsQueue.queueUrl,
      description: "Catalog Items SQS Queue URL",
      exportName: "CatalogItemsQueueUrl",
    });

    new cdk.CfnOutput(this, "CatalogItemsQueueArn", {
      value: catalogItemsQueue.queueArn,
      description: "Catalog Items SQS Queue ARN",
      exportName: "CatalogItemsQueueArn",
    });

    new cdk.CfnOutput(this, "CreateProductTopicArn", {
      value: createProductTopic.topicArn,
      description: "Create Product SNS Topic ARN",
      exportName: "CreateProductTopicArn",
    });
  }
}
