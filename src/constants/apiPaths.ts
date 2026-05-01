/*
  After deploying ProductServiceStack, replace the product URL with the value of "ProductServiceApiUrl" from CDK deploy output (without trailing slash).
  Example: https://abc123.execute-api.eu-west-1.amazonaws.com/prod

  For the cart URL: paste the "CartApiUrl" value from the Cart Service CDK stack output and KEEP the trailing "/api" suffix, it matches NestJS @Controller('api/profile/cart') prefix.
*/
const API_PATHS = {
  product: "https://tzcvbnu5l7.execute-api.eu-west-1.amazonaws.com/prod",
  order: "https://.execute-api.eu-west-1.amazonaws.com/dev",
  import: "https://5eif35x0j9.execute-api.eu-west-1.amazonaws.com/prod",
  bff: "https://.execute-api.eu-west-1.amazonaws.com/dev",
  cart: "https://13qapmn87b.execute-api.eu-west-1.amazonaws.com/prod/api",
};

export default API_PATHS;
