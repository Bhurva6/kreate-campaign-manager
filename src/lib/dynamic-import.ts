/**
 * A utility function to dynamically import modules in Next.js
 * This avoids issues with SSR when importing modules that are only available in browser
 * 
 * @param modulePath The module path to import
 * @returns The imported module
 */
export async function importDynamic<T>(modulePath: string): Promise<T> {
  const module = await import(modulePath);
  return module.default || module;
}
