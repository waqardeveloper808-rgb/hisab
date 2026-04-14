declare module "laravel-vite-plugin" {
  import type { Plugin } from "vite";

  export default function laravel(config: {
    input: string | string[];
    refresh?: boolean;
  }): Plugin | Plugin[];
}