import type { FastifyInstance } from "fastify";
import type { RegisterUserHandler } from "@todo/core/application/usecases/auth/RegisterUserHandler.js";
import type { LoginUserHandler } from "@todo/core/application/usecases/auth/LoginUserHandler.js";
import { registerSchema, loginSchema } from "../schemas/authSchemas.js";
import { domainErrorToHttp } from "../middleware/errorMapper.js";

export interface AuthHandlers {
  register: RegisterUserHandler;
  login: LoginUserHandler;
}

export function registerAuthRoutes(
  app: FastifyInstance,
  handlers: AuthHandlers,
): void {
  app.post<{ Body: unknown }>("/auth/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid request body",
      });
    }

    const result = await handlers.register.execute({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (!result.ok) {
      const httpErr = domainErrorToHttp(result.error);
      return reply.status(httpErr.statusCode).send(httpErr.body);
    }

    return reply.status(201).send(result.value);
  });

  app.post<{ Body: unknown }>("/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid request body",
      });
    }

    const result = await handlers.login.execute({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (!result.ok) {
      const httpErr = domainErrorToHttp(result.error);
      return reply.status(httpErr.statusCode).send(httpErr.body);
    }

    return reply.send(result.value);
  });
}
