import { create } from "zustand";

interface CampaignStore {
  description: string;
  imageKeys: string[];
  campaignId: string;
  setCampaignData: (description: string, imageKeys: string[], campaignId: string) => void;
  clearCampaignData: () => void;
}

export const useCampaignStore = create<CampaignStore>((set) => ({
  description: '',
  imageKeys: [],
  campaignId: '',
  setCampaignData: (description, imageKeys, campaignId) => set({ description, imageKeys, campaignId }),
  clearCampaignData: () => set({ description: '', imageKeys: [], campaignId: '' }),
}));
