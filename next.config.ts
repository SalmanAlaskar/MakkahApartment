import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit loads assets/fonts/*.ttf via a dynamic fs read at request time, which
  // Next's build tracer can't always detect statically -- make sure it ships anyway.
  outputFileTracingIncludes: {
    "/*": ["./assets/fonts/**/*"],
  },
  // @sparticuz/chromium ships a compressed binary it unpacks at runtime; letting the bundler
  // trace into it (instead of requiring it normally as a Node module) breaks that unpacking.
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
};

export default nextConfig;
