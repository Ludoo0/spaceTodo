import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

// List all spaces of the current user
router.get("/", async (req, res) => {
  const spaces = await prisma.space.findMany({
    where: { ownerId: req.session.userId! },
    orderBy: { position: "asc" },
  });
  res.json(spaces);
});

router.post("/", async (req, res) => {
  const { name, color, icon } = req.body as { name?: string; color?: string; icon?: string };
  if (!name || !name.trim()) return res.status(400).json({ error: "name ist erforderlich" });

  const count = await prisma.space.count({ where: { ownerId: req.session.userId! } });
  const space = await prisma.space.create({
    data: {
      name: name.trim(),
      color: color || "#3E7C6B",
      icon: icon || "folder",
      position: count,
      ownerId: req.session.userId!,
    },
  });
  res.status(201).json(space);
});

async function loadOwnedSpace(userId: string, spaceId: string) {
  return prisma.space.findFirst({ where: { id: spaceId, ownerId: userId } });
}

router.patch("/:id", async (req, res) => {
  const space = await loadOwnedSpace(req.session.userId!, req.params.id);
  if (!space) return res.status(404).json({ error: "Space nicht gefunden" });

  const { name, color, icon, position } = req.body as {
    name?: string;
    color?: string;
    icon?: string;
    position?: number;
  };
  const updated = await prisma.space.update({
    where: { id: space.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(color !== undefined ? { color } : {}),
      ...(icon !== undefined ? { icon } : {}),
      ...(position !== undefined ? { position } : {}),
    },
  });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const space = await loadOwnedSpace(req.session.userId!, req.params.id);
  if (!space) return res.status(404).json({ error: "Space nicht gefunden" });
  await prisma.space.delete({ where: { id: space.id } });
  res.status(204).end();
});

export default router;
