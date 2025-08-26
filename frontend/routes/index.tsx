import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import { formatMoney, listProducts, type Product } from "../lib/stripe.ts";

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
      <div class="mx-auto max-w-6xl">
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">Products</h1>
          <p class="text-gray-600">Browse our collection of products</p>
        </div>

        {products.length === 0
          ? (
            <div class="text-center py-12">
              <p class="text-gray-500 text-lg">
                No products available at the moment.
              </p>
              <p class="text-gray-400 text-sm mt-2">
                Make sure your Stripe account has active products configured.
              </p>
            </div>
          )
          : (
            <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <li
                  key={p.id}
                  class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div class="aspect-square mb-4 overflow-hidden rounded-xl bg-gray-100">
                    <img
                      src={p.images?.[0] ?? "/logo.svg"}
                      alt={p.name}
                      class="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div class="space-y-2">
                    <h2 class="text-xl font-semibold text-gray-900 leading-tight">
                      {p.name}
                    </h2>
                    {p.description && (
                      <p class="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                    <div class="pt-2">
                      <p class="text-lg font-bold text-gray-900">
                        {p.default_price?.unit_amount != null
                          ? formatMoney(
                            p.default_price.unit_amount,
                            p.default_price.currency,
                          )
                          : (
                            <span class="text-gray-500 font-normal">
                              Price not available
                            </span>
                          )}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );
});
