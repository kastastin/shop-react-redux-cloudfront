import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cdk from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";

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

    const getProductsList = new lambda.Function(this, "GetProductsListHandler", {
      ...commonLambdaProps,
      handler: "getProductsList.handler",
    });

    const getProductsById = new lambda.Function(this, "GetProductsByIdHandler", {
      ...commonLambdaProps,
      handler: "getProductsById.handler",
    });

    const createProduct = new lambda.Function(this, "CreateProductHandler", {
      ...commonLambdaProps,
      handler: "createProduct.handler",
    });

    productsTable.grantReadData(getProductsList);
    stockTable.grantReadData(getProductsList);

    productsTable.grantReadData(getProductsById);
    stockTable.grantReadData(getProductsById);

    productsTable.grantWriteData(createProduct);
    stockTable.grantWriteData(createProduct);

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
    productsResource.addMethod("GET", new apigateway.LambdaIntegration(getProductsList));
    productsResource.addMethod("POST", new apigateway.LambdaIntegration(createProduct));

    const productByIdResource = productsResource.addResource("{productId}");
    productByIdResource.addMethod("GET", new apigateway.LambdaIntegration(getProductsById));

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
  }
}
