import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

async function assertSpaceOwnership(userId: string, spaceId: string) {
  return prisma.space.findFirst({ where: { id: spaceId, ownerId: userId } });
}

async function assertNoteOwnership(userId: string, noteId: string) {
  return prisma.note.findFirst({ where: { id: noteId, space: { ownerId: userId } } });
}

router.get("/space/:spaceId", async (req, res) => {
  const space = await assertSpaceOwnership(req.session.userId!, req.params.spaceId);
  if (!space) return res.status(404).json({ error: "Space nicht gefunden" });

  const notes = await prisma.note.findMany({
    where: { spaceId: space.id },
    orderBy: { createdAt: "asc" },
  });
  res.json(notes);
});

router.post("/space/:spaceId", async (req, res) => {
  const space = await assertSpaceOwnership(req.session.userId!, req.params.spaceId);
  if (!space) return res.status(404).json({ error: "Space nicht gefunden" });

  const { content, color, x, y, rotation } = req.body as {
    content?: string;
    color?: string;
    x?: number;
    y?: number;
    rotation?: number;
  };

  const note = await prisma.note.create({
    data: {
      content: content || "",
      color: color || "#D9A441",
      x: x ?? Math.round(Math.random() * 200),
      y: y ?? Math.round(Math.random() * 120),
      rotation: rotation ?? Math.round(Math.random() * 6 - 3),
      spaceId: space.id,
    },
  });
  res.status(201).json(note);
});

router.patch("/:id", async (req, res) => {
  const note = await assertNoteOwnership(req.session.userId!, req.params.id);
  if (!note) return res.status(404).json({ error: "Notiz nicht gefunden" });

  const { content, color, x, y, rotation } = req.body as {
    content?: string;
    color?: string;
    x?: number;
    y?: number;
    rotation?: number;
  };

  const updated = await prisma.note.update({
    where: { id: note.id },
    data: {
      ...(content !== undefined ? { content } : {}),
      ...(color !== undefined ? { color } : {}),
      ...(x !== undefined ? { x } : {}),
      ...(y !== undefined ? { y } : {}),
      ...(rotation !== undefined ? { rotation } : {}),
    },
  });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const note = await assertNoteOwnership(req.session.userId!, req.params.id);
  if (!note) return res.status(404).json({ error: "Notiz nicht gefunden" });
  await prisma.note.delete({ where: { id: note.id } });
  res.status(204).end();
});

export default router;
