import { Component, type ComponentChildren } from "preact";

interface Props {
  children: ComponentChildren;
  fallback?: ComponentChildren;
  onError?: (error: Error, errorInfo?: unknown) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, error: undefined };

  static override getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo?: unknown) {
    console.error("ErrorBoundary caught an error:", error);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In development, also log to console for debugging
    if (typeof Deno !== "undefined") {
      console.error("Error info:", errorInfo);
      console.error("Stack trace:", error.stack);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium">Something went wrong</h3>
              <p class="mt-1 text-sm">
                There was an error loading this component. Please try refreshing
                the page.
              </p>
              {this.state.error && (
                <details class="mt-2">
                  <summary class="text-sm font-mono cursor-pointer hover:text-red-800">
                    Show error details
                  </summary>
                  <pre class="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <button
                type="button"
                class="mt-3 text-sm font-medium text-red-600 hover:text-red-800 underline"
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                }}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
