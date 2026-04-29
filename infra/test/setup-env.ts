process.env.PRODUCTS_TABLE = "products";
process.env.STOCK_TABLE = "stock";
process.env.AWS_REGION = "eu-west-1";
process.env.IMPORT_BUCKET = "import-service-bucket-test";
process.env.CATALOG_ITEMS_QUEUE_URL =
  "https://sqs.eu-west-1.amazonaws.com/123456789012/catalogItemsQueue";
process.env.CREATE_PRODUCT_TOPIC_ARN =
  "arn:aws:sns:eu-west-1:123456789012:createProductTopic";
