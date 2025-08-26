import { assertEquals, assertExists } from "jsr:@std/assert";
import { Button } from "./Button.tsx";

Deno.test("Button component exports correctly", () => {
  assertExists(Button);
  assertEquals(typeof Button, "function");
});

Deno.test("Button accepts props", () => {
  const props = {
    id: "test-button",
    onClick: () => {},
    children: "Click me",
  };

  const component = Button(props);
  assertExists(component);
  assertEquals(typeof component, "object");
});

Deno.test("Button renders without errors", () => {
  const component = Button({ children: "Test" });
  assertExists(component);
  assertExists(component.props);
  assertExists(component.props.children);
});
