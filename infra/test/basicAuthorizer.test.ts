import { handler } from "../lib/authorization-service/basicAuthorizer";

const METHOD_ARN =
  "arn:aws:execute-api:eu-west-1:123456789012:abcdef/prod/GET/import";

const buildToken = (raw: string) =>
  `Basic ${Buffer.from(raw).toString("base64")}`;

describe("basicAuthorizer", () => {
  it("returns Allow policy for valid credentials", async () => {
    const result = await handler({
      type: "TOKEN",
      authorizationToken: buildToken("kastastin:TEST_PASSWORD"),
      methodArn: METHOD_ARN,
    });

    expect(result.principalId).toBe("kastastin");
    expect(result.policyDocument.Statement[0].Effect).toBe("Allow");
    expect(result.policyDocument.Statement[0].Resource).toBe(METHOD_ARN);
  });

  it("returns Deny policy for wrong password", async () => {
    const result = await handler({
      type: "TOKEN",
      authorizationToken: buildToken("kastastin:WRONG"),
      methodArn: METHOD_ARN,
    });

    expect(result.policyDocument.Statement[0].Effect).toBe("Deny");
  });

  it("returns Deny policy for unknown user", async () => {
    const result = await handler({
      type: "TOKEN",
      authorizationToken: buildToken("ghost:TEST_PASSWORD"),
      methodArn: METHOD_ARN,
    });

    expect(result.policyDocument.Statement[0].Effect).toBe("Deny");
  });

  it("returns Deny policy when scheme is not Basic", async () => {
    const result = await handler({
      type: "TOKEN",
      authorizationToken: `Bearer ${Buffer.from(
        "kastastin:TEST_PASSWORD"
      ).toString("base64")}`,
      methodArn: METHOD_ARN,
    });

    expect(result.policyDocument.Statement[0].Effect).toBe("Deny");
  });

  it("returns Deny policy when decoded token has no colon", async () => {
    const result = await handler({
      type: "TOKEN",
      authorizationToken: `Basic ${Buffer.from("nocolonhere").toString(
        "base64"
      )}`,
      methodArn: METHOD_ARN,
    });

    expect(result.policyDocument.Statement[0].Effect).toBe("Deny");
  });

  it("throws Unauthorized when authorizationToken is missing", async () => {
    await expect(
      handler({ type: "TOKEN", methodArn: METHOD_ARN })
    ).rejects.toThrow("Unauthorized");
  });
});
