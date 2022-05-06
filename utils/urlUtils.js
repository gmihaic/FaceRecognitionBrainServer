export const isValidUrl = (url) => {
  if (!url) {
    return false;
  }

  try {
    new URL(url);
  } catch {
    return false;
  }

  return true;
};
