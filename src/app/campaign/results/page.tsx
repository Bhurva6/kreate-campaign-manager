'use client';

import Link from 'next/link';
import { useCampaignStore } from '../../../store/campaignStore';
import { useEffect, useState } from 'react';

export default function ResultsPage() {
  const { description, imageKeys, campaignId, errors, captions, clearCampaignData } = useCampaignStore();
  const [isLoading, setIsLoading] = useState(true);
  const [localDescription, setLocalDescription] = useState('');
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [localErrors, setLocalErrors] = useState<string[]>([]);
  const [localCaptions, setLocalCaptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchImages = async () => {
      if (campaignId && imageKeys.length > 0) {
        try {
          const response = await fetch('/api/get-campaign-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaignId, keys: imageKeys }),
          });
          const data = await response.json();
          if (response.ok && data.images) {
            setLocalImages(data.images);
          } else {
            console.error('Failed to fetch images:', data);
          }
        } catch (error) {
          console.error('Error fetching images:', error);
        }
      }
      setLocalDescription(description);
      setLocalErrors(errors);
      setLocalCaptions(captions);
      setIsLoading(false);
    };

    fetchImages();
  }, [description, imageKeys, campaignId, errors, captions]);

  // Clear data when component unmounts or on page leave
  useEffect(() => {
    return () => {
      clearCampaignData();
    };
  }, [clearCampaignData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-lg">Loading campaign results...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-4">
      {/* Navbar */}
      <div className="flex flex-row justify-between items-center w-full p-3 sm:p-4 md:p-6 bg-black z-[999999] mb-8">
        <Link href="/">
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white cursor-pointer">
            GoLoco
          </div>
        </Link>
        <Link href="/campaign">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Create New Campaign
          </button>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Campaign Results</h1>
        {(!localDescription && localImages.length === 0 && localErrors.length === 0) ? (
          <div className="text-center">
            <p className="text-lg text-gray-600">No campaign data found. Please create a new campaign.</p>
            <Link href="/campaign">
              <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Go to Campaign Creator
              </button>
            </Link>
          </div>
        ) : (
          <>
            {localDescription && (
              <div className="mb-8 p-4 bg-white rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold mb-2">Campaign Description</h2>
                <p className="text-gray-700">{localDescription}</p>
              </div>
            )}
            {localErrors.length > 0 && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h2 className="text-xl font-semibold mb-2 text-red-800">Generation Issues</h2>
                <p className="text-red-700 mb-2">
                  {localErrors.length} image{localErrors.length > 1 ? 's' : ''} couldn&apos;t be generated:
                </p>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  {localErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {localImages.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Generated Images</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {localImages.map((img: string, i: number) => (
                    <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden">
                      <img src={img} alt={`Generated Post ${i + 1}`} className="w-full h-auto" />
                      <div className="p-4">
                        <p className="text-sm text-gray-600 mb-2">Post {i + 1}</p>
                        {localCaptions[i] && (
                          <p className="text-sm text-gray-800 italic">&ldquo;{localCaptions[i]}&rdquo;</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
