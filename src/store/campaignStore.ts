import { create } from "zustand";

interface CampaignStore {
  description: string;
  imageKeys: string[];
  campaignId: string;
  errors: string[];
  captions: string[];
  setCampaignData: (description: string, imageKeys: string[], campaignId: string, errors?: string[], captions?: string[]) => void;
  clearCampaignData: () => void;
}

export const useCampaignStore = create<CampaignStore>((set) => ({
  description: '',
  imageKeys: [],
  campaignId: '',
  errors: [],
  captions: [],
  setCampaignData: (description, imageKeys, campaignId, errors = [], captions = []) => set({ description, imageKeys, campaignId, errors, captions }),
  clearCampaignData: () => set({ description: '', imageKeys: [], campaignId: '', errors: [], captions: [] }),
}));
