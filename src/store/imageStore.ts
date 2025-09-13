import { create } from "zustand";

export interface ImageData {
  id: string;
  url: string; // R2 public URL
  dataUrl?: string; // Base64 data URL for immediate display
  prompt?: string;
  r2Key?: string;
  signedUrl?: string;
  category?: string;
  uploadedAt?: string;
  userId?: string;
  additionalUrls?: string[]; // Additional image URLs for variations
}

interface ImageStore {
  selectedImage: string | ImageData | null;
  images: ImageData[];
  setSelectedImage: (img: string | ImageData | null) => void;
    addImage: (img: ImageData) => void;
  addImages: (imgs: ImageData[]) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  getImagesByCategory: (category: string) => ImageData[];
}

export const useImageStore = create<ImageStore>((set, get) => ({
  selectedImage: null,
  images: [],
  
  setSelectedImage: (img) => set({ selectedImage: img }),
  
  addImage: (img) => set((state) => ({
    images: [...state.images, img]
  })),
  
  addImages: (imgs) => set((state) => ({
    images: [...state.images, ...imgs]
  })),
  
  removeImage: (id) => set((state) => ({
    images: state.images.filter(img => img.id !== id),
    selectedImage:
  typeof state.selectedImage === "object" &&
  state.selectedImage !== null &&
  "id" in state.selectedImage &&
  state.selectedImage.id === id
    ? null
    : state.selectedImage
  })),
  
  clearImages: () => set({ images: [], selectedImage: null }),
  
  getImagesByCategory: (category) => {
    const { images } = get();
    return images.filter(img => img.category === category);
  },
})); 