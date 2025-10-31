import { useState } from 'react';
import Link from 'next/link';

export default function NewPhotoshootsWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'upload' | 'categorize' | 'selectModel'>('upload');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (uploadedImages.length + files.length > 10) {
      alert('Maximum 10 images allowed');
      return;
    }
    setUploadedImages(prev => [...prev, ...files]);
    if (uploadedImages.length + files.length > 0) {
      setStep('categorize');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'upload':
        return (
          <div className="flex justify-center">
            <div className="border-2 border-dashed border-white/50 rounded-lg p-8 text-center max-w-md">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                id="image-upload"
                onChange={handleFileUpload}
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="text-white text-lg mb-2">Upload garment photos (max 10)</div>
                <div className="text-white/70">Supported formats: JPG, PNG, GIF</div>
              </label>
            </div>
          </div>
        );
      case 'categorize':
        return <CategorizeGarments images={uploadedImages} onNext={() => setStep('selectModel')} />;
      case 'selectModel':
        return <SelectModel onBack={() => setStep('categorize')} onNext={() => {}} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-white text-2xl font-bold">New Photoshoots</h2>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors"
        >
          ✕
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 text-white text-lg mb-8">
        <span className={`px-4 py-2 rounded-lg ${step === 'upload' ? 'bg-[#6C2F83]' : 'bg-[#6C2F83] opacity-50'}`}>Upload Images</span>
        <span className="text-gray-400">→</span>
        <span className={`px-4 py-2 rounded-lg ${step === 'categorize' ? 'bg-[#181E53]' : 'bg-[#181E53] opacity-50'}`}>Categorize</span>
        <span className="text-gray-400">→</span>
        <span className={`px-4 py-2 rounded-lg ${step === 'selectModel' ? 'bg-[#6C2F83]' : 'bg-[#6C2F83] opacity-50'}`}>Select Model</span>
        <span className="text-gray-400">→</span>
        <span className="bg-[#181E53] px-4 py-2 rounded-lg opacity-50">Select Backgrounds</span>
        <span className="text-gray-400">→</span>
        <span className="bg-[#6C2F83] px-4 py-2 rounded-lg opacity-50">Select Poses</span>
        <span className="text-gray-400">→</span>
        <span className="bg-[#181E53] px-4 py-2 rounded-lg opacity-50">Select Styles</span>
        <span className="text-gray-400">→</span>
        <span className="bg-[#6C2F83] px-4 py-2 rounded-lg opacity-50">Review</span>
      </div>
      {renderStep()}
    </div>
  );
}

function CategorizeGarments({ images, onNext }: { images: File[], onNext: () => void }) {
  const [filter, setFilter] = useState<'all' | 'upper' | 'lower' | 'full'>('all');
  const [categories, setCategories] = useState<Record<number, string>>({});

  const filteredImages = images.filter((_, i) => {
    if (filter === 'all') return true;
    return categories[i] === filter;
  });

  return (
    <div>
     
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {images.map((img, i) => (
          <div key={i} className="border border-white/20 rounded-lg p-4">
            <img src={URL.createObjectURL(img)} alt={`Garment ${i + 1}`} className="w-full h-32 object-cover rounded mb-2" />
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setCategories({ ...categories, [i]: 'upper' })}
                className={`px-2 py-1 text-xs rounded ${categories[i] === 'upper' ? 'bg-[#6C2F83] text-white' : 'bg-white/20 text-white'}`}
              >
                Upper
              </button>
              <button
                onClick={() => setCategories({ ...categories, [i]: 'lower' })}
                className={`px-2 py-1 text-xs rounded ${categories[i] === 'lower' ? 'bg-[#181E53] text-white' : 'bg-white/20 text-white'}`}
              >
                Lower
              </button>
              <button
                onClick={() => setCategories({ ...categories, [i]: 'full' })}
                className={`px-2 py-1 text-xs rounded ${categories[i] === 'full' ? 'bg-[#6C2F83] text-white' : 'bg-white/20 text-white'}`}
              >
                Full
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-lg bg-[#6C2F83] text-white font-semibold hover:shadow-lg hover:shadow-[#3C38A4]/25 transition-all duration-300"
        >
          Select Model
        </button>
      </div>
    </div>
  );
}

function SelectModel({ onBack, onNext }: { onBack: () => void, onNext: () => void }) {
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);

  // Placeholder model images - in real app, these would come from an API
  const models = [
    { src: '/person.jpg', gender: 'female', description: 'North Indian, Middle Aged' },
    { src: '/einstein1.jpeg', gender: 'male', description: 'North Indian, Middle Aged' },
    { src: '/einstein2.jpeg', gender: 'male', description: 'North Indian, Middle Aged' },
    { src: '/einstein3.jpeg', gender: 'female', description: 'North Indian, Middle Aged' },
    { src: '/einstein4.jpeg', gender: 'male', description: 'North Indian, Middle Aged' },
    { src: '/einstein5.jpeg', gender: 'female', description: 'North Indian, Middle Aged' },
  ];

  const filteredModels = selectedGender ? models.filter(model => model.gender === selectedGender) : models;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
        >
          ← Back
        </button>
        <h3 className="text-white text-xl font-bold">Select a Model</h3>
        <div></div>
      </div>
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setSelectedGender('male')}
          className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
            selectedGender === 'male'
              ? 'bg-[#6C2F83] text-white shadow-lg shadow-[#3C38A4]/25'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          Male
        </button>
        <button
          onClick={() => setSelectedGender('female')}
          className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
            selectedGender === 'female'
              ? 'bg-[#181E53] text-white hover:bg-[#502D81]'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          Female
        </button>
        <button
          onClick={() => setSelectedGender(null)}
          className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
            selectedGender === null
              ? 'bg-[#3C38A4] text-white'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          All
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filteredModels.map((model, i) => (
          <div key={i} className="border border-white/20 rounded-lg p-4 cursor-pointer hover:border-white/50 transition-colors">
            <img src={model.src} alt={`Model ${i + 1}`} className="w-full h-48 object-cover rounded mb-2" />
            <p className="text-white/70 text-sm text-center">{model.description}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-4">
        <Link
          href="/create-model"
          className="px-6 py-3 rounded-lg bg-[#6C2F83] text-white font-semibold hover:shadow-lg hover:shadow-[#3C38A4]/25 transition-all duration-300 text-center"
        >
          Create Your Own Model
        </Link>
        <button
          onClick={onNext}
          className="px-6 py-3 rounded-lg bg-[#181E53] text-white font-semibold hover:bg-[#502D81] transition-all duration-300"
        >
          Next: Select Backgrounds
        </button>
      </div>
    </div>
  );
}
