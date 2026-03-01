import cors from "cors";

export const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://kai-campus-12o7.vercel.app'],
  credentials: true,
  optionsSuccessStatus: 200
};
