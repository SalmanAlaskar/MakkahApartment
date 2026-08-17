import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit loads assets/fonts/*.ttf via a dynamic fs read at request time, which
  // Next's build tracer can't always detect statically -- make sure it ships anyway.
  outputFileTracingIncludes: {
    "/*": ["./assets/fonts/**/*"],
  },
};

export default nextConfig;
