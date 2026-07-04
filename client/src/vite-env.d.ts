/// <reference types="vite/client" />

// Global declarations for stylesheet imports
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}