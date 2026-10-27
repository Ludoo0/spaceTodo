import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { Space, Todo } from "@/db";
import { requireAuth } from "@/middleware/requireAuth";
import {
  createTodoSchema,
  returnValidationError,
  updateTodoSchema,
} from "@/validation/schemas.ts";

const router = Router();
router.use(requireAuth);

async function assertSpaceOwnership(userId: string, spaceId: string) {
  return await Space.findOne({ where: { id: spaceId, ownerId: userId } });
}

async function assertTodoOwnership(userId: string, todoId: string) {
  return Todo.findOne({
    where: { id: todoId },
    include: [
      {
        association: "space",
        where: { ownerId: userId },
        required: true,
      },
    ],
  });
}

// Aggregated, prioritized todos across ALL spaces - used on the home page
router.get("/priority", async (req, res) => {
  const todos = await Todo.findAll({
    where: {
      priority: true,
      done: false,
    },
    include: [
      {
        association: "space",
        where: { ownerId: req.session.userId! },
        attributes: ["id", "name", "color", "icon"],
        required: true,
      },
    ],
    order: [
      ["position", "ASC"],
      ["createdAt", "ASC"],
    ],
  });
  res.json(todos);
});

router.get("/space/:spaceId", async (req, res) => {
  const space = await assertSpaceOwnership(
    req.session.userId!,
    req.params.spaceId,
  );
  if (!space) return res.status(404).json({ error: "Space nicht gefunden" });

  const todos = await Todo.findAll({
    where: { spaceId: space.id },
    order: [
      ["done", "ASC"],
      ["position", "ASC"],
      ["createdAt", "ASC"],
    ],
  });
  res.json(todos);
});

router.post("/space/:spaceId", async (req, res) => {
  const space = await assertSpaceOwnership(
    req.session.userId!,
    req.params.spaceId,
  );
  if (!space) return res.status(404).json({ error: "Space nicht gefunden" });

  const parsed = createTodoSchema.safeParse(req.body);
  if (!parsed.success) return returnValidationError(res, parsed.error);

  const { title } = parsed.data;

  const count = await Todo.count({ where: { spaceId: space.id } });
  const todo = await Todo.create({
    id: uuidv4(),
    title,
    spaceId: space.id,
    position: count,
  });
  res.status(201).json(todo);
});

router.patch("/:id", async (req, res) => {
  const todo = await assertTodoOwnership(req.session.userId!, req.params.id);
  if (!todo) return res.status(404).json({ error: "Todo nicht gefunden" });

  const parsed = updateTodoSchema.partial().safeParse(req.body);
  if (!parsed.success) return returnValidationError(res, parsed.error);

  const { title, done, priority, position } = parsed.data;

  const updated = await todo.update({
    ...(title !== undefined ? { title } : {}),
    ...(done !== undefined ? { done } : {}),
    ...(priority !== undefined ? { priority } : {}),
    ...(position !== undefined ? { position } : {}),
  });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const todo = await assertTodoOwnership(req.session.userId!, req.params.id);
  if (!todo) return res.status(404).json({ error: "Todo nicht gefunden" });
  await todo.destroy();
  res.status(204).end();
});

export default router;
