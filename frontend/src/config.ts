const prod = {
  url: import.meta.env.API_URL,
};
const dev = {
  url: 'http://localhost:42069',
};

export default import.meta.env.MODE === 'development' ? dev : prod;
