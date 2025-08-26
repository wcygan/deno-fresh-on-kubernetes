// frontend/lib/money_test.ts
import { assertEquals } from "jsr:@std/assert";
import { formatMoney } from "./money.ts";

Deno.test("formatMoney formats cents and currency", () => {
  assertEquals(formatMoney(1234, "usd"), "$12.34");
  assertEquals(formatMoney(0, "usd"), "$0.00");
  assertEquals(formatMoney(99, "eur"), "€0.99");
  assertEquals(formatMoney(1500, "gbp"), "£15.00");
});

Deno.test("formatMoney handles invalid currency gracefully", () => {
  assertEquals(formatMoney(1234, "invalid"), "12.34 INVALID");
});
