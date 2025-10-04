import { create } from "zustand";

interface CampaignStore {
  description: string;
  imageKeys: string[];
  campaignId: string;
  errors: string[];
  captions: string[];
  logoBase64: string;
  logoPosition: string;
  region: string;
  state: string;
  setCampaignData: (description: string, imageKeys: string[], campaignId: string, errors?: string[], captions?: string[], logoBase64?: string, logoPosition?: string, region?: string, state?: string) => void;
  clearCampaignData: () => void;
}

export const useCampaignStore = create<CampaignStore>((set) => ({
  description: '',
  imageKeys: [],
  campaignId: '',
  errors: [],
  captions: [],
  logoBase64: '',
  logoPosition: '',
  region: '',
  state: '',
  setCampaignData: (description, imageKeys, campaignId, errors = [], captions = [], logoBase64 = '', logoPosition = '', region = '', state = '') => set({ description, imageKeys, campaignId, errors, captions, logoBase64, logoPosition, region, state }),
  clearCampaignData: () => set({ description: '', imageKeys: [], campaignId: '', errors: [], captions: [], logoBase64: '', logoPosition: '', region: '', state: '' }),
}));
