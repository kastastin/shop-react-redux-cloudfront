import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import { Construct } from "constructs";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importBucket = new s3.Bucket(this, "ImportBucket", {
      bucketName: `import-service-bucket-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      cors: [
        {
          allowedOrigins: ["*"],
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
          allowedHeaders: ["*"],
          exposedHeaders: ["ETag"],
        },
      ],
    });

    const catalogItemsQueue = sqs.Queue.fromQueueAttributes(
      this,
      "ImportedCatalogItemsQueue",
      {
        queueArn: cdk.Fn.importValue("CatalogItemsQueueArn"),
        queueUrl: cdk.Fn.importValue("CatalogItemsQueueUrl"),
      }
    );

    const commonLambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      code: lambda.Code.fromAsset(path.join(__dirname, "./")),
      environment: {
        IMPORT_BUCKET: importBucket.bucketName,
      },
    };

    const importProductsFile = new lambda.Function(
      this,
      "ImportProductsFileHandler",
      {
        ...commonLambdaProps,
        handler: "importProductsFile.handler",
      }
    );

    const importFileParser = new lambdaNodejs.NodejsFunction(
      this,
      "ImportFileParserHandler",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(30),
        entry: path.join(__dirname, "importFileParser.ts"),
        handler: "handler",
        environment: {
          IMPORT_BUCKET: importBucket.bucketName,
          CATALOG_ITEMS_QUEUE_URL: catalogItemsQueue.queueUrl,
        },
        bundling: { minify: false, sourceMap: false },
      }
    );

    importBucket.grantPut(importProductsFile);
    importBucket.grantRead(importFileParser);
    importBucket.grantPut(importFileParser);
    importBucket.grantDelete(importFileParser);
    catalogItemsQueue.grantSendMessages(importFileParser);

    importBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParser),
      { prefix: "uploaded/" }
    );

    const api = new apigateway.RestApi(this, "ImportServiceApi", {
      restApiName: "Import Service API",
      description: "This API serves the Import Service Lambda functions.",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    const importResource = api.root.addResource("import");
    importResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFile),
      {
        requestParameters: { "method.request.querystring.name": true },
      }
    );

    new cdk.CfnOutput(this, "ImportServiceApiUrl", {
      value: api.url,
      description: "Import Service API Gateway URL",
      exportName: "ImportServiceApiUrl",
    });

    new cdk.CfnOutput(this, "ImportBucketName", {
      value: importBucket.bucketName,
      description: "Import Service S3 Bucket Name",
    });
  }
}
