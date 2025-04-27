# Batch Uploader Component

## Overview

The `BatchUploader` component enables users to upload multiple files simultaneously, edit their metadata, and publish them together.

## Component Structure

```
StreamChainUploader (Main Class)
├── BatchUploadManager
│   ├── FileProcessor
│   ├── MetadataManager
│   └── ProgressTracker
├── NFTManager
├── RevenueManager
└── PublishingScheduler
```

## Dependencies

- IPFS Client for decentralized storage
- Web3 libraries for blockchain interaction
- Drag-and-Drop API for file handling

## Usage

### Basic Implementation

```javascript
const uploader = new StreamChainUploader({
  container: document.getElementById('upload-container'),
  maxFiles: 50,
  supportedTypes: ['video/*', 'audio/*', 'image/*', 'application/pdf'],
  maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
  enableNFT: true,
  enableScheduling: true
});

// Initialize uploader
uploader.init();

// Listen for events
uploader.on('batchComplete', result => {
  console.log(`Batch upload complete: ${result.success} succeeded, ${result.failed} failed`);
});
```

### Configuration Options

| Option            | Type    | Default       | Description                                  |
| ----------------- | ------- | ------------- | -------------------------------------------- |
| container         | Element | null          | DOM element to render the uploader in        |
| maxFiles          | Number  | 50            | Maximum number of files allowed in one batch |
| supportedTypes    | Array   | ['*']         | Array of MIME types to accept                |
| maxFileSize       | Number  | 2GB           | Maximum size per file in bytes               |
| chunkSize         | Number  | 5MB           | Size of chunks for resumable uploads         |
| concurrentUploads | Number  | 3             | Number of simultaneous file uploads          |
| enableNFT         | Boolean | true          | Enable NFT creation options                  |
| enableScheduling  | Boolean | true          | Enable scheduled publishing                  |
| metadataTemplate  | Object  | {}            | Default metadata for new uploads             |
| uploadEndpoint    | String  | '/api/upload' | API endpoint for uploads                     |

## Events

The component emits the following events:

| Event          | Description                        | Callback Data                                         |
| -------------- | ---------------------------------- | ----------------------------------------------------- |
| filesAdded     | Files have been added to the batch | `{ files: Array }`                                    |
| uploadStart    | Batch upload has started           | `{ totalFiles: Number, totalSize: Number }`           |
| fileProgress   | Progress update for a file         | `{ file: Object, progress: Number }`                  |
| fileComplete   | Single file upload completed       | `{ file: Object, result: Object }`                    |
| fileError      | Error uploading a file             | `{ file: Object, error: Error }`                      |
| batchProgress  | Overall batch progress             | `{ progress: Number, filesComplete: Number }`         |
| batchComplete  | Entire batch completed             | `{ success: Number, failed: Number, results: Array }` |
| metadataUpdate | Metadata has been updated          | `{ fileId: String, metadata: Object }`                |

## Methods

### `init()`

Initializes the uploader and sets up event listeners.

### `addFiles(files: FileList | Array)`

Adds files to the current batch.

```javascript
uploader.addFiles(document.getElementById('file-input').files);
```

### `addFilesFromUrls(urls: Array)`

Adds files from URLs to the current batch.

```javascript
uploader.addFilesFromUrls(['https://example.com/video.mp4']);
```

### `importFromCSV(csvFile: File)`

Imports metadata from a CSV file and associates it with uploaded files.

```javascript
uploader.importFromCSV(csvFile);
```

### `removeFile(fileId: String)`

Removes a file from the batch by ID.

```javascript
uploader.removeFile('file-1234');
```

### `updateMetadata(fileId: String, metadata: Object)`

Updates metadata for a specific file.

```javascript
uploader.updateMetadata('file-1234', {
  title: 'New Title',
  description: 'Updated description'
});
```

### `bulkUpdateMetadata(fileIds: Array, metadata: Object)`

Updates metadata for multiple files at once.

```javascript
uploader.bulkUpdateMetadata(['file-1234', 'file-5678'], {
  category: 'Music',
  tags: ['electronic', 'ambient']
});
```

### `startUpload()`

Starts uploading the current batch.

```javascript
uploader.startUpload();
```

### `pauseUpload()`

Pauses the current batch upload.

```javascript
uploader.pauseUpload();
```

### `resumeUpload()`

Resumes a paused upload.

```javascript
uploader.resumeUpload();
```

### `cancelUpload()`

Cancels the current upload process.

```javascript
uploader.cancelUpload();
```

## Implementation Examples

### Simple Implementation

```html
<div id="batch-uploader"></div>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    const uploader = new StreamChainUploader({
      container: document.getElementById('batch-uploader')
    });

    uploader.init();
  });
</script>
```

### Advanced Implementation with Custom Handling

```javascript
const uploader = new StreamChainUploader({
  container: document.getElementById('advanced-uploader'),
  maxFiles: 100,
  supportedTypes: ['video/mp4', 'video/webm', 'audio/mp3'],
  concurrentUploads: 5,
  metadataTemplate: {
    category: 'Music',
    language: 'en',
    license: 'CC-BY'
  }
});

uploader.init();

// Custom event handling
uploader.on('fileComplete', ({ file, result }) => {
  // Add to user's content library
  addToLibrary(result.ipfsHash, file.metadata);

  // Update analytics
  trackUpload({
    fileType: file.type,
    fileSize: file.size,
    duration: result.processingTime
  });
});

uploader.on('batchComplete', ({ results }) => {
  // Save batch information
  saveBatchRecord(results);

  // Notify user
  showNotification(`Batch upload complete. ${results.length} files uploaded.`);

  // Reset form
  resetForm();
});

// Handle form submission
document.getElementById('publish-form').addEventListener('submit', event => {
  event.preventDefault();

  // Set monetization options
  const monetizationModel = document.querySelector('input[name="monetization"]:checked').value;
  uploader.setMonetizationModel(monetizationModel);

  // Start the upload
  uploader.startUpload();
});
```

## Browser Compatibility

The component is compatible with:

- Chrome 70+
- Firefox 65+
- Safari 12.1+
- Edge 79+

Mobile support:

- iOS Safari 12.2+
- Android Chrome 70+

## Performance Considerations

- Large batches (>30 files) may cause performance issues on lower-end devices
- Consider implementing pagination for very large batches
- Use `concurrentUploads` setting to balance between speed and resource usage
- The component implements connection throttling detection to avoid timeouts

## Security Notes

- All uploads are processed through IPFS with content addressing
- Files are verified for integrity using SHA-256 checksums
- Content moderation is applied during processing
- User must have sufficient STREAM tokens for storage costs
