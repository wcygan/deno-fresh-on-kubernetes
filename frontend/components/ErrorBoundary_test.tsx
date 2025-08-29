import { assert, assertEquals } from "jsr:@std/assert";
import { ErrorBoundary } from "./ErrorBoundary.tsx";
import { Component } from "preact";

// Component that throws an error for testing
class ThrowingComponent extends Component {
  override componentDidMount() {
    throw new Error("Test error");
  }

  render() {
    return <div>This should not render</div>;
  }
}

Deno.test("ErrorBoundary - constructor creates proper initial state", () => {
  const boundary = new ErrorBoundary({ children: null });
  assertEquals(boundary.state.hasError, false);
  assertEquals(boundary.state.error, undefined);
});

Deno.test("ErrorBoundary - getDerivedStateFromError sets error state", () => {
  const error = new Error("Test error");
  const state = ErrorBoundary.getDerivedStateFromError(error);

  assertEquals(state.hasError, true);
  assertEquals(state.error, error);
});

Deno.test("ErrorBoundary - componentDidCatch logs error", () => {
  const originalError = console.error;
  let loggedMessages: string[] = [];
  console.error = (...args: unknown[]) => {
    loggedMessages.push(args.join(" "));
  };

  try {
    const boundary = new ErrorBoundary({ children: null });
    const testError = new Error("Test error");

    boundary.componentDidCatch(testError, { componentStack: "test stack" });

    assert(
      loggedMessages.some((msg) =>
        msg.includes("ErrorBoundary caught an error")
      ),
    );
    assert(loggedMessages.some((msg) => msg.includes("Test error")));
  } finally {
    console.error = originalError;
  }
});

Deno.test("ErrorBoundary - calls onError callback when provided", () => {
  let capturedError: Error | undefined;
  const onError = (error: Error) => {
    capturedError = error;
  };

  const originalError = console.error;
  console.error = () => {};

  try {
    const boundary = new ErrorBoundary({ children: null, onError });
    const testError = new Error("Test error");

    boundary.componentDidCatch(testError);

    assert(capturedError);
    assertEquals(capturedError.message, "Test error");
  } finally {
    console.error = originalError;
  }
});

Deno.test("ErrorBoundary - render returns children when no error", () => {
  const boundary = new ErrorBoundary({ children: "test content" });
  const result = boundary.render();

  assertEquals(result, "test content");
});

Deno.test("ErrorBoundary - render returns custom fallback when error and fallback provided", () => {
  const fallback = <div>Custom fallback</div>;
  const boundary = new ErrorBoundary({ children: null, fallback });
  // Manually set error state
  boundary.state = { hasError: true, error: new Error("test") };

  const result = boundary.render();
  assertEquals(result, fallback);
});
