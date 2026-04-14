// After deploying ProductServiceStack, replace the product URL with
// the value of "ProductServiceApiUrl" from CDK deploy output (without trailing slash).
// Example: https://abc123.execute-api.eu-west-1.amazonaws.com/prod
const API_PATHS = {
  product: "https://tzcvbnu5l7.execute-api.eu-west-1.amazonaws.com/prod",
  order: "https://.execute-api.eu-west-1.amazonaws.com/dev",
  import: "https://.execute-api.eu-west-1.amazonaws.com/dev",
  bff: "https://.execute-api.eu-west-1.amazonaws.com/dev",
  cart: "https://.execute-api.eu-west-1.amazonaws.com/dev",
};

export default API_PATHS;
