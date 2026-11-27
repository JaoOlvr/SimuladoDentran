export const cacheDirectory = 'file:///cache/';
export const documentDirectory = 'file:///documents/';

export const getInfoAsync = jest.fn(async () => ({ exists: false }));
export const deleteAsync = jest.fn(async () => {});
export const getContentUriAsync = jest.fn(async (uri: string) => `content://${uri}`);
export const createDownloadResumable = jest.fn(() => ({
  downloadAsync: jest.fn(async () => ({ uri: 'file:///cache/SimulaDetran-update.apk' })),
}));

export default {
  cacheDirectory,
  documentDirectory,
  getInfoAsync,
  deleteAsync,
  getContentUriAsync,
  createDownloadResumable,
};
