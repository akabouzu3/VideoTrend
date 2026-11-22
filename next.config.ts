import type { NextConfig } from "next";

const config: NextConfig = {
  experimental: {
    // Use the compiler API where Next.js cannot capture the CLI subprocess output.
    useTypeScriptCli: false,
  },
};

export default config;
