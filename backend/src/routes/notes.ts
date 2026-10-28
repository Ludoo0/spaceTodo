import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { Note, Space } from "@/config/db.ts";
import { requireAuth } from "@/middleware/requireAuth";
import { noteSchema, returnValidationError } from "@/validation/schemas.ts";

const router = Router();
router.use(requireAuth);

async function assertSpaceOwnership(userId: string, spaceId: string) {
  return Space.findOne({ where: { id: spaceId, ownerId: userId } });
}

async function assertNoteOwnership(userId: string, noteId: string) {
  return Note.findOne({
    where: { id: noteId },
    include: [
      {
        association: "space",
        where: { ownerId: userId },
        required: true,
      },
    ],
  });
}

router.get("/space/:spaceId", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: "unauthenticated" });

  const space = await assertSpaceOwnership(userId, req.params.spaceId);
  if (!space) return res.status(404).json({ error: "Space nicht gefunden" });

  const notes = await Note.findAll({
    where: { spaceId: space.id },
    order: [["createdAt", "ASC"]],
  });
  res.json(notes);
});

router.post("/space/:spaceId", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: "unauthenticated" });

  const space = await assertSpaceOwnership(userId, req.params.spaceId);
  if (!space) return res.status(404).json({ error: "Space nicht gefunden" });

  const parsed = noteSchema.safeParse(req.body);
  if (!parsed.success) return returnValidationError(res, parsed.error);

  const { content, color, x, y, rotation } = parsed.data;

  const note = await Note.create({
    id: uuidv4(),
    content,
    color,
    x,
    y,
    rotation,
    spaceId: space.id,
  });
  res.status(201).json(note);
});

router.patch("/:id", async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: "unauthenticated" });

  const note = await assertNoteOwnership(userId, req.params.id);
  if (!note) return res.status(404).json({ error: "Notiz nicht gefunden" });

  const parsed = noteSchema.partial().safeParse(req.body);
  if (!parsed.success) return returnValidationError(res, parsed.error);

  const { content, color, x, y, rotation } = parsed.data;

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
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: "unauthenticated" });

  const note = await assertNoteOwnership(userId, req.params.id);
  if (!note) return res.status(404).json({ error: "Notiz nicht gefunden" });
  await note.destroy();
  res.status(204).end();
});

export default router;
