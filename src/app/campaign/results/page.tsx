'use client';

import Link from 'next/link';
import { useCampaignStore } from '../../../store/campaignStore';
import { useEffect, useState } from 'react';

export default function ResultsPage() {
  type ImageKey = string | { url: string };
  const { description, imageKeys, campaignId, errors, captions, clearCampaignData, region, state } = useCampaignStore();
  const [isLoading, setIsLoading] = useState(true);
  const [localDescription, setLocalDescription] = useState('');
  interface ImageData {
    url: string;
  }
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [localErrors, setLocalErrors] = useState<string[]>([]);
  const [localCaptions, setLocalCaptions] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState('');
  const [editImagePrompt, setEditImagePrompt] = useState('');
  const [isImageEditingLoading, setIsImageEditingLoading] = useState(false);

  useEffect(() => {
    console.log('Raw imageKeys:', imageKeys); // Debug log for raw data
    console.log('Description:', description);
    
    if (!imageKeys || imageKeys.length === 0) {
      console.log('No image keys found');
      setIsLoading(false);
      return;
    }

    // Process and format base64 images for display
    const processedImages = imageKeys.map((imgData: ImageKey) => {
      console.log('Processing image data:', imgData); // Debug log for each image

      // If imgData is an object with url property (from API response)
      if (typeof imgData === 'object' && imgData !== null) {
        console.log('Image data is an object:', imgData);
        if ('url' in imgData && imgData.url) {
          return imgData.url;
        }
        // If the object has different structure, try to handle it
        if ('images' in imgData && Array.isArray((imgData as any).images)) {
          const firstImage = (imgData as any).images[0];
          return firstImage?.url || null;
        }
      }
      
      // If the data is already a complete data URL
      if (typeof imgData === 'string') {
        console.log('Image data is a string');
        if (imgData.startsWith('data:image')) {
          return imgData;
        }
        // If it's just base64 data, add the proper prefix
        return `data:image/png;base64,${imgData}`;
      }
      return null;
    }).filter((img): img is string => Boolean(img)); // Remove any null values and type assertion
    
    console.log('Processed Images:', processedImages); // Debug log for final results
    
    if (processedImages.length > 0) {
      setLocalImages(processedImages);
      setLocalDescription(description);
      setLocalErrors(errors);
      setLocalCaptions(captions);
    } else {
      console.log('No valid images after processing');
    }
    setIsLoading(false);
  }, [description, imageKeys, errors, captions]);

  // Clear data when component unmounts or on page leave
  useEffect(() => {
    return () => {
      clearCampaignData();
    };
  }, [clearCampaignData]);

  const handleImageClick = (image: string, caption: string) => {
    setSelectedImage(image);
    setEditedCaption(caption);
    setIsModalOpen(true);
    setIsEditing(false);
    setEditImagePrompt('');
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditImagePrompt('');
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedCaption(e.target.value);
  };

  const handleCaptionSave = () => {
    const updatedCaptions = [...localCaptions];
    const index = localImages.indexOf(selectedImage!);
    updatedCaptions[index] = editedCaption;
    setLocalCaptions(updatedCaptions);
    setIsEditing(false);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleEditImage = async () => {
    if (!selectedImage || !editImagePrompt.trim()) return;
    
    setIsImageEditingLoading(true);
    try {
      // Extract base64 data if it's a complete data URL
      const base64Data = selectedImage.includes('base64,') 
        ? selectedImage.split('base64,')[1] 
        : selectedImage;

      const editResponse = await fetch('/api/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: editImagePrompt.trim(), 
          input_image: base64Data,
          userId: 'anonymous'
        }),
      });
      
      const data = await editResponse.json();
      
      if (editResponse.ok && data.result?.sample) {
        // Format the response data as a complete data URL if needed
        const processedImage = data.result.sample.startsWith('data:image') 
          ? data.result.sample 
          : `data:image/jpeg;base64,${data.result.sample}`;

        // Update the image in the grid and modal
        const index = localImages.indexOf(selectedImage);
        const updatedImages = [...localImages];
        updatedImages[index] = processedImage;
        setLocalImages(updatedImages);
        setSelectedImage(processedImage);
        setEditImagePrompt('');
      } else {
        alert('Failed to edit image: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error editing image:', error);
      alert('Error editing image. Please try again.');
    } finally {
      setIsImageEditingLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedImage) return;
    try {
      // Convert base64 to blob
      const base64Data = selectedImage.split(',')[1]; // Remove the data URL prefix if present
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      const blob = new Blob(byteArrays, { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `campaign-image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download image. Please try again.');
    }
  };

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
                <h2 className="text-2xl text-black font-semibold mb-2">Campaign Description</h2>
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
                <h2 className="text-2xl font-semibold mb-4">Generated Images - Click to edit</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {localImages.map((img: string, i: number) => (
                    <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden">
                      <img
                        src={img}
                        alt={`Generated Post ${i + 1}`}
                        className="w-full h-auto cursor-pointer"
                        onClick={() => handleImageClick(img, localCaptions[i] || '')}
                      />
                      <div className="p-4">
                        <p className="text-sm text-gray-600 mb-2">{localCaptions[i] || `Post ${i + 1}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal for image and caption editing */}
            {isModalOpen && (
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="absolute inset-0 bg-black opacity-50" onClick={handleModalClose}></div>
                <div className="bg-white rounded-lg shadow-lg max-w-md w-full z-10 mx-4">
                  <div className="relative">
                    <img
                      src={selectedImage!}
                      alt="Selected"
                      className="w-full h-auto rounded-t-lg max-h-96 object-contain"
                    />
                    {isImageEditingLoading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                        <div className="text-white text-center">
                          <p className="text-lg font-bold">Edit Image</p>
                          <p>{editImagePrompt}</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex space-x-2">
                      <button
                        className="text-white bg-blue-500 hover:bg-blue-600 rounded-full p-2"
                        onClick={handleDownload}
                        title="Download Image"
                      >
                        ⬇️
                      </button>
                      <button
                        className="text-white bg-red-500 hover:bg-red-600 rounded-full p-2"
                        onClick={handleModalClose}
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h2 className="text-xl text-black font-semibold mb-2">Edit Caption</h2>
                    {isEditing ? (
                      <textarea 
                        value={editedCaption}
                        onChange={handleCaptionChange}
                        className="text-black w-full p-2 border border-gray-300 rounded-lg mb-4"
                        rows={3}
                      />
                    ) : (
                      <p className="text-black mb-4">{editedCaption}</p>
                    )}
                    <div className="flex justify-end space-x-2">
                      {isEditing ? (
                        <>
                          <button
                            className="px-4 py-2 bg-green-500 text-black rounded-lg hover:bg-green-600"
                            onClick={handleCaptionSave}
                          >
                            Save
                          </button>
                          <button
                            className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
                            onClick={() => setIsEditing(false)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="px-4 py-2 bg-blue-500 text-black rounded-lg hover:bg-blue-600"
                            onClick={handleEditClick}
                          >
                            Edit Caption
                          </button>
                          <button
                            className="px-4 py-2 bg-purple-500 text-black rounded-lg hover:bg-purple-600"
                            onClick={() => {
                              const location = [region, state].filter(Boolean).join(', ');
                              setEditImagePrompt(location ? `${editedCaption} in ${location}` : editedCaption);
                              handleEditImage();
                            }}
                            disabled={isImageEditingLoading}
                          >
                            {isImageEditingLoading ? 'Editing...' : 'Edit Image'}
                          </button>
                          <button
                            className="px-4 py-2 bg-green-500 text-black rounded-lg hover:bg-green-600"
                            onClick={handleDownload}
                          >
                            Download Image
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
