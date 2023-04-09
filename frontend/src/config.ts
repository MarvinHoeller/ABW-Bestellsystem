const prod = {
  url: import.meta.env.BS_API_URL || 'https://rikorick.de/api/order',
};
const dev = {
  url: 'http://localhost:42069',
};

export default import.meta.env.MODE === 'development' ? dev : prod;
