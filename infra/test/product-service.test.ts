import { handler as getProductsListHandler } from '../lib/product-service/getProductsList';
import { handler as getProductsByIdHandler } from '../lib/product-service/getProductsById';
import { products } from '../lib/product-service/products';

describe('getProductsList', () => {
  it('should return 200 with all products', async () => {
    const result = await getProductsListHandler();

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(products);
  });

  it('should return CORS headers', async () => {
    const result = await getProductsListHandler();

    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
  });

  it('should return non-empty products array', async () => {
    const result = await getProductsListHandler();
    const body = JSON.parse(result.body);

    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });
});

describe('getProductsById', () => {
  it('should return 200 with the correct product when valid id is provided', async () => {
    const event = { pathParameters: { productId: '1' } };
    const result = await getProductsByIdHandler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.id).toBe('1');
    expect(body.title).toBeDefined();
    expect(body.price).toBeDefined();
    expect(body.count).toBeDefined();
  });

  it('should return 404 when product is not found', async () => {
    const event = { pathParameters: { productId: 'non-existent-id' } };
    const result = await getProductsByIdHandler(event);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body)).toEqual({ message: 'Product not found' });
  });

  it('should return 400 when productId is missing', async () => {
    const event = { pathParameters: null };
    const result = await getProductsByIdHandler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({ message: 'Product ID is required' });
  });

  it('should return CORS headers', async () => {
    const event = { pathParameters: { productId: '1' } };
    const result = await getProductsByIdHandler(event);

    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});
