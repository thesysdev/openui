export default {
  "/api/**": {
    target: `http://127.0.0.1:${process.env.API_PORT || 4300}`,
    secure: false,
  },
};
