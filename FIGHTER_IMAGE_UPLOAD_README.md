# Fighter Image Upload Functionality

## Overview
The UFC Picks application now supports direct fighter image uploads instead of manually entering image URLs. Admins can upload fighter images directly through the admin event creation form.

## Features
- **File Upload**: Accepts JPG, PNG, and GIF image files
- **Size Limit**: Maximum file size of 2MB
- **Image Optimization**: Automatically resizes images to 300x300 pixels
- **Circular Display**: Images are cropped and displayed as circles
- **Preview**: Shows image preview before and after upload
- **Error Handling**: Graceful error handling for upload failures
- **Image Removal**: Ability to remove uploaded images

## Technical Implementation

### Backend Changes
1. **New Route**: `POST /api/events/upload-fighter-image`
   - Location: `server/routes/events.js`
   - Authentication: Admin only
   - Uses multer for file handling
   - Integrates with Cloudinary for image storage and optimization

2. **Cloudinary Configuration**
   - Images stored in `ufc-picks/fighter-images` folder
   - Automatic transformation: 300x300 crop with face detection
   - Circular cropping applied
   - Unique public IDs generated for each upload

3. **File Validation**
   - Image type validation (only image files allowed)
   - File size validation (2MB limit)
   - Error handling for various upload scenarios

### Frontend Changes
1. **New Component**: `FighterImageUpload`
   - Location: `client/src/components/FighterImageUpload.tsx`
   - Handles file selection, preview, and upload
   - Shows upload progress and error states
   - Provides image removal functionality

2. **Updated Forms**
   - `AdminCreateEvent`: Replaced URL inputs with image upload components
   - Maintains existing form structure and validation
   - Integrates seamlessly with existing fighter data handling

3. **API Integration**
   - New `uploadFighterImage` function in `eventsAPI`
   - Handles FormData creation and multipart uploads
   - Integrates with existing error handling and toast notifications

## Usage

### For Admins
1. Navigate to Admin → Create Event
2. In the fighter section, click "Upload Image" for each fighter
3. Select an image file (JPG, PNG, or GIF, max 2MB)
4. Image will be automatically uploaded and optimized
5. Preview the circular image display
6. Remove image if needed using the remove button

### File Requirements
- **Format**: JPG, PNG, or GIF
- **Size**: Maximum 2MB
- **Content**: Fighter headshot or portrait recommended
- **Quality**: High resolution images work best for optimization

## Database Storage
- Fighter images are stored as Cloudinary URLs in the existing `fighter1Image` and `fighter2Image` fields
- No database schema changes required
- URLs point to optimized, circular 300x300 images

## Security Features
- Admin-only access to upload functionality
- File type validation on both client and server
- File size limits enforced
- Cloudinary secure URLs used for storage

## Error Handling
- File type validation errors
- File size limit exceeded
- Upload failures (network, Cloudinary errors)
- Graceful fallbacks and user-friendly error messages

## Dependencies
- **Backend**: multer, cloudinary (already installed)
- **Frontend**: react-hot-toast (already installed)
- **No additional packages required**

## Future Enhancements
- Bulk image upload for multiple fighters
- Image cropping interface for better face positioning
- Support for additional image formats
- Image compression options
- Backup image storage options

## Testing
To test the functionality:
1. Start both server and client
2. Login as an admin user
3. Navigate to Admin → Create Event
4. Try uploading various image types and sizes
5. Verify circular display and optimization
6. Test error scenarios (invalid files, large files, etc.)
