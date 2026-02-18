import type { FastifyInstance } from "fastify";
import { tagId } from "@todo/core/domain/shared/index.js";
import type { CreateTagHandler } from "@todo/core/application/usecases/tags/CreateTagHandler.js";
import type { UpdateTagHandler } from "@todo/core/application/usecases/tags/UpdateTagHandler.js";
import type { DeleteTagHandler } from "@todo/core/application/usecases/tags/DeleteTagHandler.js";
import type { ListTagsHandler } from "@todo/core/application/usecases/tags/ListTagsHandler.js";
import { createTagSchema, updateTagSchema } from "../schemas/tagSchemas.js";
import { domainErrorToHttp, zodValidationError } from "../middleware/errorMapper.js";

export interface TagHandlers {
  createTag: CreateTagHandler;
  updateTag: UpdateTagHandler;
  deleteTag: DeleteTagHandler;
  listTags: ListTagsHandler;
}

export function registerTagRoutes(
  app: FastifyInstance,
  handlers: TagHandlers,
): void {
  app.post<{ Body: unknown }>("/tags", async (request, reply) => {
    const parsed = createTagSchema.safeParse(request.body);
    if (!parsed.success) {
      const err = zodValidationError(parsed.error);
      return reply.status(err.statusCode).send(err.body);
    }

    const result = await handlers.createTag.execute(
      { name: parsed.data.name, color: parsed.data.color },
      request.ctx,
    );

    if (!result.ok) {
      const httpErr = domainErrorToHttp(result.error);
      return reply.status(httpErr.statusCode).send(httpErr.body);
    }

    return reply.status(201).send(result.value);
  });

  app.patch<{ Params: { id: string }; Body: unknown }>("/tags/:id", async (request, reply) => {
    const parsed = updateTagSchema.safeParse(request.body);
    if (!parsed.success) {
      const err = zodValidationError(parsed.error);
      return reply.status(err.statusCode).send(err.body);
    }

    const result = await handlers.updateTag.execute({
      tagId: tagId(request.params.id),
      name: parsed.data.name,
      color: parsed.data.color,
    }, request.ctx);

    if (!result.ok) {
      const httpErr = domainErrorToHttp(result.error);
      return reply.status(httpErr.statusCode).send(httpErr.body);
    }

    return reply.send(result.value);
  });

  app.delete<{ Params: { id: string } }>("/tags/:id", async (request, reply) => {
    const result = await handlers.deleteTag.execute({
      tagId: tagId(request.params.id),
    }, request.ctx);

    if (!result.ok) {
      const httpErr = domainErrorToHttp(result.error);
      return reply.status(httpErr.statusCode).send(httpErr.body);
    }

    return reply.status(204).send();
  });

  app.get("/tags", async (request, reply) => {
    const tags = await handlers.listTags.execute(request.ctx);
    return reply.send(tags);
  });
}
