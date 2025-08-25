import React, { useState, useRef } from 'react';
import { eventsAPI } from '../services/api';
import toast from 'react-hot-toast';

interface FighterImageUploadProps {
  fighterNumber: 1 | 2;
  currentImageUrl: string;
  onImageChange: (imageUrl: string) => void;
  onImageRemove: () => void;
}

const FighterImageUpload: React.FC<FighterImageUploadProps> = ({
  fighterNumber,
  currentImageUrl,
  onImageChange,
  onImageRemove
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setIsUploading(true);
    try {
      const result = await eventsAPI.uploadFighterImage(file);
      onImageChange(result.imageUrl);
      toast.success(`Fighter ${fighterNumber} image uploaded successfully!`);
      setPreviewUrl(null); // Clear preview since we now have the actual URL
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onImageRemove();
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayImage = previewUrl || currentImageUrl;

  return (
    <div className="space-y-3">
      <label className="block text-white font-medium mb-2">
        Fighter {fighterNumber} Image
      </label>
      
      {/* Image Preview */}
      {displayImage && (
        <div className="relative inline-block">
          <img
            src={displayImage}
            alt={`Fighter ${fighterNumber}`}
            className="w-24 h-24 rounded-full object-cover border-2 border-gray-600"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold"
            title="Remove image"
          >
            ×
          </button>
        </div>
      )}

      {/* Upload Controls */}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id={`fighter${fighterNumber}Image`}
        />
        <label
          htmlFor={`fighter${fighterNumber}Image`}
          className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
            isUploading
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isUploading ? 'Uploading...' : 'Upload Image'}
        </label>
        
        {currentImageUrl && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      {/* Help Text */}
      <p className="text-sm text-gray-400">
        Upload a fighter image (JPG, PNG, GIF). Max size: 2MB. 
        Images will be optimized to 300x300 and displayed as circles.
      </p>
    </div>
  );
};

export default FighterImageUpload;
