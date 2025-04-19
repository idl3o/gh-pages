/**
 * Resizes an image to a specified width and height.
 * @param {File} imageFile - The image file to resize.
 * @param {number} maxWidth - The maximum width of the resized image.
 * @param {number} maxHeight - The maximum height of the resized image.
 * @returns {Promise<File>} - A promise that resolves with the resized image file.
 */
export async function resizeImage(imageFile, maxWidth, maxHeight) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width *= maxHeight / height;
        height = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => {
          const resizedFile = new File([blob], imageFile.name, {
            type: imageFile.type,
            lastModified: Date.now()
          });
          resolve(resizedFile);
        },
        imageFile.type,
        0.7
      ); // Reduce quality to 70%
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(imageFile);
  });
}
