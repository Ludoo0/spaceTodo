import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { Space } from "@/db";
import { requireAuth } from "@/middleware/requireAuth";
import {
  createSpaceSchema,
  returnValidationError,
  updateSpaceSchema,
} from "@/validation/schemas.ts";

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
  const parsed = createSpaceSchema.safeParse(req.body);
  if (!parsed.success) return returnValidationError(res, parsed.error);

  const { name, color, icon } = parsed.data;

  const count = await Space.count({ where: { ownerId: req.session.userId! } });
  const space = await Space.create({
    id: uuidv4(),
    name,
    color,
    icon,
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

  const parsed = updateSpaceSchema.safeParse(req.body);
  if (!parsed.success) return returnValidationError(res, parsed.error);
  const { name, color, icon, position, noteLayout } = parsed.data;

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
