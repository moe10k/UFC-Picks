# Avatar Upload Implementation Guide

## What Was Implemented

### 1. Server-Side Changes ✅

#### Dependencies Added
- **multer**: For handling file uploads
- **cloudinary**: For cloud image storage

#### New API Endpoint
- **Route**: `POST /api/auth/avatar`
- **Location**: `server/routes/auth.js`
- **Features**:
  - Authenticated endpoint (requires user login)
  - File validation (images only, max 2MB)
  - Automatic upload to Cloudinary
  - Updates user's avatar field in database
  - Returns updated user object

#### Security Features
- File type validation (images only)
- File size limit (2MB)
- User authentication required
- Cloudinary folder organization (`ufc-picks/avatars`)

### 2. Client-Side Changes ✅

#### API Service Updates
- **File**: `client/src/services/api.ts`
- **New Method**: `authAPI.uploadAvatar(file: File)`
- **Features**: Handles FormData creation and multipart upload

#### Authentication Context Updates
- **File**: `client/src/context/AuthContext.tsx`
- **New Method**: `uploadAvatar(file: File)`
- **Features**: Updates user state after successful upload

#### Profile Page UI Updates
- **File**: `client/src/pages/Profile.tsx`
- **New Features**:
  - File input for image selection
  - Image preview before upload
  - Upload button with loading state
  - File validation (type and size)
  - Error handling and user feedback

### 3. Documentation Updates ✅

#### Environment Variables
- **File**: `env.example`
- **Added**: Cloudinary configuration variables

#### README Updates
- **File**: `README.md`
- **Added**: Avatar upload endpoint documentation
- **Added**: Cloudinary setup instructions

## What You Need to Do Next

### 1. Set Up Cloudinary Account (Required)

1. **Create Cloudinary Account**
   - Go to [cloudinary.com](https://cloudinary.com)
   - Sign up for a free account
   - Verify your email

2. **Get Your Credentials**
   - Log into Cloudinary Dashboard
   - Go to "Settings" → "Access Keys"
   - Copy your:
     - Cloud Name
     - API Key
     - API Secret

### 2. Configure Environment Variables

#### Local Development
1. **Copy environment file**
   ```bash
   cp env.example .env
   ```

2. **Edit `.env` file**
   ```env
   # Add these lines to your .env file
   CLOUDINARY_CLOUD_NAME=your_cloud_name_here
   CLOUDINARY_API_KEY=your_api_key_here
   CLOUDINARY_API_SECRET=your_api_secret_here
   ```

#### Production (Heroku)
```bash
heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name
heroku config:set CLOUDINARY_API_KEY=your_api_key
heroku config:set CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Restart Your Server

After adding the environment variables:
```bash
# Stop your current server (Ctrl+C)
# Then restart
npm run dev
# or
npm start
```

### 4. Test the Feature

1. **Login to your account**
2. **Go to Profile page** (`/profile`)
3. **Click "Edit Profile"**
4. **Scroll down to see the new upload section**
5. **Select an image file** (JPG, PNG, etc.)
6. **Click "Upload Avatar"**
7. **Verify the avatar appears** in your profile

## How It Works

### Upload Flow
1. User selects image file in Profile page
2. Client validates file (type, size)
3. Client shows preview
4. User clicks upload
5. File sent to server as FormData
6. Server validates and uploads to Cloudinary
7. Cloudinary returns secure URL
8. Server updates user's avatar field
9. Client receives updated user object
10. Profile displays new avatar

### File Storage
- **Location**: Cloudinary cloud storage
- **Organization**: `ufc-picks/avatars/` folder
- **Naming**: `user_{userId}_{timestamp}`
- **Access**: Public URLs for display
- **Backup**: Original files preserved

## Troubleshooting

### Common Issues

#### "Image upload service not configured"
- **Cause**: Missing Cloudinary environment variables
- **Solution**: Add CLOUDINARY_* variables to .env

#### "File too large"
- **Cause**: Image exceeds 2MB limit
- **Solution**: Compress image or use smaller file

#### "Only image files are allowed"
- **Cause**: Non-image file selected
- **Solution**: Select JPG, PNG, GIF, or other image format

#### Upload fails silently
- **Check**: Browser console for errors
- **Check**: Server logs for backend errors
- **Verify**: Cloudinary credentials are correct

### Testing Without Cloudinary

If you don't want to set up Cloudinary immediately:
- Users can still set avatar URLs manually
- The upload endpoint will return an error
- All other functionality remains intact

## Security Considerations

- **File Size**: Limited to 2MB
- **File Type**: Images only (MIME validation)
- **Authentication**: Login required for uploads
- **Storage**: Cloudinary handles security
- **Access**: Public URLs (consider if this meets your needs)

## Next Steps After Setup

1. **Test with different image formats**
2. **Verify avatar displays in other parts of the app**
3. **Check avatar appears in leaderboards**
4. **Consider adding avatar to user lists**
5. **Monitor Cloudinary usage** (free tier limits)

## Support

If you encounter issues:
1. Check server console logs
2. Check browser console logs
3. Verify environment variables are set
4. Ensure Cloudinary account is active
5. Check file size and format requirements

---

**Status**: ✅ Implementation Complete  
**Next Action**: Configure Cloudinary and test the feature
