import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { Construct } from "constructs";

const AUTHORIZED_USERNAME = "kastastin";

export class AuthorizationServiceStack extends cdk.Stack {
  public readonly basicAuthorizer: lambda.Function;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const password = process.env[AUTHORIZED_USERNAME];
    if (!password) {
      throw new Error(
        `Missing credentials for ${AUTHORIZED_USERNAME} in environment. ` +
          `Set ${AUTHORIZED_USERNAME}=<password> in infra/.env`
      );
    }

    this.basicAuthorizer = new lambda.Function(this, "BasicAuthorizer", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      handler: "basicAuthorizer.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "./")),
      environment: {
        [AUTHORIZED_USERNAME]: password,
      },
    });

    new cdk.CfnOutput(this, "BasicAuthorizerArn", {
      value: this.basicAuthorizer.functionArn,
      description: "Basic Authorizer Lambda ARN",
      exportName: "BasicAuthorizerArn",
    });
  }
}
