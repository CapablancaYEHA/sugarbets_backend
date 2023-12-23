export const isDevMode = () => process.env.NODE_ENV === "development";
export const originIp = "http://45.89.66.41";

export const corsObj = {
  allowedHeaders: [
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
    "Access-Control-Allow-Methods",
    "Access-Control-Allow-Credentials",
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Origin",
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-HTTP-Method-Override",
    "Request",
  ],
  exposedHeaders: ["*"],
  credentials: true,
  origin: originIp,
  preflightContinue: false,
  methods: "GET, POST, PUT, PATCH, POST, DELETE",
  optionsSuccessStatus: 200,
};
