import { Router } from "express";
import { Note, Space } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();
router.use(requireAuth);

async function assertSpaceOwnership(userId: string, spaceId: string) {
  return Space.findOne({ where: { id: spaceId, ownerId: userId } });
}

async function assertNoteOwnership(userId: string, noteId: string) {
  return Note.findOne({
    where: { id: noteId },
    include: [{
      association: "space",
      where: { ownerId: userId },
      required: true,
    }],
  });
}

router.get("/space/:spaceId", async (req, res) => {
  const space = await assertSpaceOwnership(req.session.userId!, req.params.spaceId);
  if (!space) return res.status(404).json({ error: "Space nicht gefunden" });

  const notes = await Note.findAll({
    where: { spaceId: space.id },
    order: [["createdAt", "ASC"]],
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

  const note = await Note.create({
    id: uuidv4(),
    content: content || "",
    color: color || "#D9A441",
    x: x ?? Math.round(Math.random() * 650),
    y: y ?? Math.round(Math.random() * 240),
    rotation: rotation ?? Math.round(Math.random() * 6 - 3),
    spaceId: space.id,
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

  const updated = await note.update({
    ...(content !== undefined ? { content } : {}),
    ...(color !== undefined ? { color } : {}),
    ...(x !== undefined ? { x } : {}),
    ...(y !== undefined ? { y } : {}),
    ...(rotation !== undefined ? { rotation } : {}),
  });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const note = await assertNoteOwnership(req.session.userId!, req.params.id);
  if (!note) return res.status(404).json({ error: "Notiz nicht gefunden" });
  await note.destroy();
  res.status(204).end();
});

export default router;
