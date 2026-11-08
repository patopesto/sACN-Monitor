/// <reference types="astro/client" />

declare module '*.svg?raw' {
  const content: string;
  export default content;
}

declare module 'virtual:astro-theme-project' {
  import type { ProjectConfig } from '@patopest/astro-theme/config';
  export const project: ProjectConfig;
}
