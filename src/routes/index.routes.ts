import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ message: "Route works" });
});

export default router;