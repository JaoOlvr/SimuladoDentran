export const isAvailableAsync = jest.fn(async () => true);
export const shareAsync = jest.fn(async (uri: string, options?: any) => {});

export default {
  isAvailableAsync,
  shareAsync,
};

