import { Router } from "express";
import { Space } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();
router.use(requireAuth);

// List all spaces of the current user
router.get("/", async (req, res) => {
  const spaces = await Space.findAll({
    where: { ownerId: req.session.userId! },
    order: [["position", "ASC"]],
  });
  res.json(spaces);
});

router.post("/", async (req, res) => {
  const { name, color, icon } = req.body as { name?: string; color?: string; icon?: string };
  if (!name || !name.trim()) return res.status(400).json({ error: "name ist erforderlich" });

  const count = await Space.count({ where: { ownerId: req.session.userId! } });
  const space = await Space.create({
    id: uuidv4(),
    name: name.trim(),
    color: color || "#3E7C6B",
    icon: icon || "folder",
    position: count,
    ownerId: req.session.userId!,
  });
  res.status(201).json(space);
});

async function loadOwnedSpace(userId: string, spaceId: string) {
  return Space.findOne({ where: { id: spaceId, ownerId: userId } });
}

router.patch("/:id", async (req, res) => {
  const space = await loadOwnedSpace(req.session.userId!, req.params.id);
  if (!space) return res.status(404).json({ error: "Space nicht gefunden" });

  const { name, color, icon, position, noteLayout } = req.body as {
    name?: string;
    color?: string;
    icon?: string;
    position?: number;
    noteLayout?: string;
  };
  const updated = await space.update({
    ...(name !== undefined ? { name } : {}),
    ...(color !== undefined ? { color } : {}),
    ...(icon !== undefined ? { icon } : {}),
    ...(position !== undefined ? { position } : {}),
    ...(noteLayout !== undefined ? { noteLayout } : {}),
  });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const space = await loadOwnedSpace(req.session.userId!, req.params.id);
  if (!space) return res.status(404).json({ error: "Space nicht gefunden" });
  await space.destroy();
  res.status(204).end();
});

export default router;
