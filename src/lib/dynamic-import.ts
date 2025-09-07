/**
 * A utility function to dynamically import modules in Next.js
 * This avoids issues with SSR when importing modules that are only available in browser
 * 
 * @param importFactory A function that returns the dynamic import (must use literal string)
 * @returns The imported module
 */
export async function importDynamic<T>(importFactory: () => Promise<any>): Promise<T> {
  try {
    const importedModule = await importFactory();
    return importedModule.default || importedModule;
  } catch (error) {
    console.error("Dynamic import failed:", error);
    throw error;
  }
}
