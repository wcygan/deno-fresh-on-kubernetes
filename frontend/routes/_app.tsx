import { define } from "../utils.ts";

export default define.page(function App({ Component }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Application</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body class="min-h-screen bg-[--color-bg] text-neutral-900">
        <Component />
      </body>
    </html>
  );
});
