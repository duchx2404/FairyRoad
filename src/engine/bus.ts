// Cầu nối engine → giao diện. UI gán các hàm này khi khởi động.
export const hooks = {
  toast: (_msg: string) => {},
  render: () => {},
  onDeath: () => {},
  onAscend: () => {},
};
