export const openDatabaseSync = jest.fn(() => ({
  execSync: jest.fn(),
  runSync: jest.fn(),
  getFirstSync: jest.fn(),
  getAllSync: jest.fn(),
}));

export default {
  openDatabaseSync,
};

