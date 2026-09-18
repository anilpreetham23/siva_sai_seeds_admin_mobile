import { Filesystem, Directory } from '@capacitor/filesystem';
import { isNative } from './index';

export const platformFiles = {
  /**
   * Save a file to device storage (e.g. PDF receipt, exported report)
   */
  async saveFile({ fileName, base64Data, mimeType = 'application/pdf' }) {
    if (isNative) {
      try {
        const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
        const result = await Filesystem.writeFile({
          path: fileName,
          data: cleanBase64,
          directory: Directory.Documents,
          recursive: true,
        });
        return {
          uri: result.uri,
          success: true,
        };
      } catch (err) {
        console.warn('[Files] Filesystem.writeFile error:', err);
        throw err;
      }
    }

    // Web Fallback: trigger standard browser download
    const cleanBase64 = base64Data.includes(',') ? base64Data : `data:${mimeType};base64,${base64Data}`;
    const link = document.createElement('a');
    link.href = cleanBase64;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { uri: fileName, success: true };
  },

  /**
   * Download a Blob as a file
   */
  async downloadBlob(blob, fileName) {
    if (isNative) {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64 = reader.result;
            const res = await platformFiles.saveFile({
              fileName,
              base64Data: base64,
              mimeType: blob.type,
            });
            resolve(res);
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    // Web fallback
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
    return { uri: fileName, success: true };
  }
};

export default platformFiles;
