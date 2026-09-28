import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit loads assets/fonts/*.ttf via a dynamic fs read at request time, and
  // @sparticuz/chromium unpacks its compressed binaries from bin/ the same way -- Next's
  // build tracer can't detect either statically, so both must be included explicitly.
  outputFileTracingIncludes: {
    "/*": ["./assets/fonts/**/*", "./node_modules/@sparticuz/chromium/bin/**/*"],
  },
  // @sparticuz/chromium ships a compressed binary it unpacks at runtime; letting the bundler
  // trace into it (instead of requiring it normally as a Node module) breaks that unpacking.
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
};

export default nextConfig;
