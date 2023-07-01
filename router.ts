import { Router } from "oak";

import { todoEmitter } from "./common/emitter.ts";

export const router = new Router();

router.get("/todos-ws", async (ctx) => {
  if (!ctx.isUpgradable) {
    ctx.throw(501);
  }

  const createdBy = ctx.request.headers.get("CreatedBy");

  if (!createdBy) {
    ctx.throw(400);
  }

  const ws = ctx.upgrade();

  for await (const todo of todoEmitter) {
    if (todo.createdBy === createdBy) {
      ws.send(JSON.stringify(todo));
    }
  }
});

router.post("/todos", async (ctx) => {
  const createdBy = ctx.request.headers.get("CreatedBy");

  if (!createdBy) {
    ctx.throw(400);
  }

  const { value } = ctx.request.body({ type: "json" });
  const data = await value;

  try {
    await todoEmitter.postAndWait({ ...data, createdBy });

    ctx.response.status = 200;
    ctx.response.body = { isSuccessful: true };
  } catch {
    ctx.throw(400);
  }
});
