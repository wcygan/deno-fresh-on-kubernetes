import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import { listProducts, type Product } from "../lib/stripe.ts";
import Cart from "../islands/Cart.tsx";
import ProductListItem from "../islands/ProductListItem.tsx";

export default define.page(async function Home() {
  const products: Product[] = await listProducts(24);

  return (
    <div class="px-4 py-8 mx-auto bg-gray-50 min-h-screen">
      <Head>
        <title>Products - Fresh Store</title>
        <meta
          name="description"
          content="Browse our products powered by Stripe"
        />
      </Head>
      <div class="mx-auto max-w-7xl">
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">Products</h1>
          <p class="text-gray-600">Browse our collection of products</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Products Section */}
          <div class="lg:col-span-3">
            {products.length === 0
              ? (
                <div class="text-center py-12">
                  <p class="text-gray-500 text-lg">
                    No products available at the moment.
                  </p>
                  <p class="text-gray-400 text-sm mt-2">
                    Make sure your Stripe account has active products
                    configured.
                  </p>
                </div>
              )
              : (
                <ul class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {products.map((product) => {
                    const price = product.default_price;
                    return (
                      <li key={product.id}>
                        <ProductListItem
                          productId={product.id}
                          name={product.name}
                          description={product.description}
                          images={product.images}
                          priceId={price?.id}
                          unitAmount={price?.unit_amount ?? undefined}
                          currency={price?.currency}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
          </div>

          {/* Cart Section */}
          <div class="lg:col-span-1">
            <Cart />
          </div>
        </div>
      </div>
    </div>
  );
});
