import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

async function assertSpaceOwnership(userId: string, spaceId: string) {
  const space = await prisma.space.findFirst({ where: { id: spaceId, ownerId: userId } });
  return space;
}

async function assertTodoOwnership(userId: string, todoId: string) {
  return prisma.todo.findFirst({
    where: { id: todoId, space: { ownerId: userId } },
    include: { space: true },
  });
}

// Aggregated, prioritized todos across ALL spaces - used on the home page
router.get("/priority", async (req, res) => {
  const todos = await prisma.todo.findMany({
    where: {
      priority: true,
      done: false,
      space: { ownerId: req.session.userId! },
    },
    include: { space: { select: { id: true, name: true, color: true, icon: true } } },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  res.json(todos);
});

router.get("/space/:spaceId", async (req, res) => {
  const space = await assertSpaceOwnership(req.session.userId!, req.params.spaceId);
  if (!space) return res.status(404).json({ error: "Space nicht gefunden" });

  const todos = await prisma.todo.findMany({
    where: { spaceId: space.id },
    orderBy: [{ done: "asc" }, { position: "asc" }, { createdAt: "asc" }],
  });
  res.json(todos);
});

router.post("/space/:spaceId", async (req, res) => {
  const space = await assertSpaceOwnership(req.session.userId!, req.params.spaceId);
  if (!space) return res.status(404).json({ error: "Space nicht gefunden" });

  const { title } = req.body as { title?: string };
  if (!title || !title.trim()) return res.status(400).json({ error: "title ist erforderlich" });

  const count = await prisma.todo.count({ where: { spaceId: space.id } });
  const todo = await prisma.todo.create({
    data: { title: title.trim(), spaceId: space.id, position: count },
  });
  res.status(201).json(todo);
});

router.patch("/:id", async (req, res) => {
  const todo = await assertTodoOwnership(req.session.userId!, req.params.id);
  if (!todo) return res.status(404).json({ error: "Todo nicht gefunden" });

  const { title, done, priority, position } = req.body as {
    title?: string;
    done?: boolean;
    priority?: boolean;
    position?: number;
  };

  const updated = await prisma.todo.update({
    where: { id: todo.id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(done !== undefined ? { done } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(position !== undefined ? { position } : {}),
    },
  });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const todo = await assertTodoOwnership(req.session.userId!, req.params.id);
  if (!todo) return res.status(404).json({ error: "Todo nicht gefunden" });
  await prisma.todo.delete({ where: { id: todo.id } });
  res.status(204).end();
});

export default router;
