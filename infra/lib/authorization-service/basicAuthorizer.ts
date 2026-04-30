type AuthorizerEvent = {
  type?: string;
  authorizationToken?: string;
  methodArn: string;
};

type Effect = "Allow" | "Deny";

interface AuthResponse {
  principalId: string;
  policyDocument: {
    Version: "2012-10-17";
    Statement: Array<{
      Action: "execute-api:Invoke";
      Effect: Effect;
      Resource: string;
    }>;
  };
}

const generatePolicy = (
  principalId: string,
  effect: Effect,
  resource: string
): AuthResponse => ({
  principalId,
  policyDocument: {
    Version: "2012-10-17",
    Statement: [
      { Action: "execute-api:Invoke", Effect: effect, Resource: resource },
    ],
  },
});

export const handler = async (
  event: AuthorizerEvent
): Promise<AuthResponse> => {
  console.log("basicAuthorizer event:", JSON.stringify(event));

  if (!event.authorizationToken) {
    throw new Error("Unauthorized");
  }

  const [scheme, token] = event.authorizationToken.split(" ");
  if (scheme !== "Basic" || !token) {
    return generatePolicy("user", "Deny", event.methodArn);
  }

  let username = "user";
  let effect: Effect = "Deny";

  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex === -1) {
      return generatePolicy(username, "Deny", event.methodArn);
    }

    username = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);
    const expectedPassword = process.env[username];

    if (expectedPassword && expectedPassword === password) {
      effect = "Allow";
    }
  } catch (err) {
    console.error("basicAuthorizer decode error:", err);
    return generatePolicy(username, "Deny", event.methodArn);
  }

  console.log(`basicAuthorizer decision: ${effect} for ${username}`);
  return generatePolicy(username, effect, event.methodArn);
};
