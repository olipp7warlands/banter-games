import "dotenv/config";
import cors from "cors";
import express from "express";
import { giftRouter } from "./routes/gift";
import { playRouter } from "./routes/play";
import { storeRouter } from "./routes/store";

const app = express();
const shellOrigin = process.env.SHELL_ORIGIN ?? "http://localhost:5173";

app.use(cors({ origin: shellOrigin }));
app.use(express.json());
app.use(playRouter);
app.use(giftRouter);
app.use(storeRouter);

app.get("/", (_req, res) => {
  res.json({ ok: true });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`Banter API escuchando en :${port}`);
});
