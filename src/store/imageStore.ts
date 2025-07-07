import { create } from "zustand";

type ImageStore = {
  selectedImage: string | null;
  setSelectedImage: (img: string | null) => void;
};

export const useImageStore = create<ImageStore>((set) => ({
  selectedImage: null,
  setSelectedImage: (img) => set({ selectedImage: img }),
})); 