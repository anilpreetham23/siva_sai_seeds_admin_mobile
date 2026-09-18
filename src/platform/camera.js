import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNative } from './index';

export const platformCamera = {
  /**
   * Capture photo directly from native camera
   */
  async takePhoto(options = {}) {
    if (isNative) {
      try {
        const image = await Camera.getPhoto({
          quality: options.quality || 85,
          allowEditing: options.allowEditing ?? false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          width: options.maxWidth || 1920,
          height: options.maxHeight || 1920,
          correctOrientation: true,
        });
        return {
          dataUrl: image.dataUrl,
          format: image.format,
          webPath: image.webPath,
        };
      } catch (err) {
        if (err.message && err.message.includes('User cancelled')) {
          return null;
        }
        throw err;
      }
    }
    return platformCamera.pickFileViaInput('image/*');
  },

  /**
   * Pick image from photo gallery / library
   */
  async pickFromGallery(options = {}) {
    if (isNative) {
      try {
        const image = await Camera.getPhoto({
          quality: options.quality || 85,
          allowEditing: options.allowEditing ?? false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos,
          width: options.maxWidth || 1920,
          height: options.maxHeight || 1920,
          correctOrientation: true,
        });
        return {
          dataUrl: image.dataUrl,
          format: image.format,
          webPath: image.webPath,
        };
      } catch (err) {
        if (err.message && err.message.includes('User cancelled')) {
          return null;
        }
        throw err;
      }
    }
    return platformCamera.pickFileViaInput('image/*');
  },

  /**
   * General Image Picker (Camera or Gallery)
   */
  async pickImage(options = {}) {
    if (isNative) {
      try {
        const image = await Camera.getPhoto({
          quality: options.quality || 85,
          allowEditing: options.allowEditing ?? false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Prompt, // Native prompt: Camera or Photos
          width: options.maxWidth || 1920,
          height: options.maxHeight || 1920,
          correctOrientation: true,
        });
        return {
          dataUrl: image.dataUrl,
          format: image.format,
          webPath: image.webPath,
        };
      } catch (err) {
        if (err.message && err.message.includes('User cancelled')) {
          return null;
        }
        throw err;
      }
    }
    return platformCamera.pickFileViaInput('image/*');
  },

  /**
   * Web fallback using hidden HTML5 input element
   */
  pickFileViaInput(accept = 'image/*') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.style.display = 'none';

      input.onchange = (e) => {
        const file = e.target.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            dataUrl: reader.result,
            format: file.type.split('/')[1] || 'jpeg',
            file: file,
            name: file.name,
            size: file.size,
          });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      };

      document.body.appendChild(input);
      input.click();
      setTimeout(() => document.body.removeChild(input), 1000);
    });
  },

  /**
   * Check camera permissions
   */
  async checkPermissions() {
    if (isNative) {
      return await Camera.checkPermissions();
    }
    return { camera: 'granted', photos: 'granted' };
  },

  /**
   * Request camera permissions
   */
  async requestPermissions() {
    if (isNative) {
      return await Camera.requestPermissions();
    }
    return { camera: 'granted', photos: 'granted' };
  }
};

export default platformCamera;
