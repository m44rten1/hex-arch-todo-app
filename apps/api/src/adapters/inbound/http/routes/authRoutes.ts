import type { FastifyInstance, FastifyReply } from "fastify";
import type { RegisterUserHandler } from "@todo/core/application/usecases/auth/RegisterUserHandler.js";
import type { LoginUserHandler } from "@todo/core/application/usecases/auth/LoginUserHandler.js";
import type { GetMeHandler } from "@todo/core/application/usecases/auth/GetMeHandler.js";
import { registerSchema, loginSchema } from "../schemas/authSchemas.js";
import { domainErrorToHttp, zodValidationError } from "../middleware/errorMapper.js";
import type { AuthDTO } from "@todo/core/application/dto/AuthDTO.js";

export interface AuthHandlers {
  register: RegisterUserHandler;
  login: LoginUserHandler;
  getMe: GetMeHandler;
}

const COOKIE_NAME = "token";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function setAuthCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SEVEN_DAYS_MS / 1000,
  });
}

function sendAuthResponse(reply: FastifyReply, result: AuthDTO, statusCode = 200) {
  setAuthCookie(reply, result.token);
  return reply.status(statusCode).send({ user: result.user });
}

export function registerPublicAuthRoutes(
  app: FastifyInstance,
  handlers: AuthHandlers,
): void {
  app.post<{ Body: unknown }>("/auth/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      const err = zodValidationError(parsed.error);
      return reply.status(err.statusCode).send(err.body);
    }

    const result = await handlers.register.execute({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (!result.ok) {
      const httpErr = domainErrorToHttp(result.error);
      return reply.status(httpErr.statusCode).send(httpErr.body);
    }

    return sendAuthResponse(reply, result.value, 201);
  });

  app.post<{ Body: unknown }>("/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      const err = zodValidationError(parsed.error);
      return reply.status(err.statusCode).send(err.body);
    }

    const result = await handlers.login.execute({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (!result.ok) {
      const httpErr = domainErrorToHttp(result.error);
      return reply.status(httpErr.statusCode).send(httpErr.body);
    }

    return sendAuthResponse(reply, result.value);
  });

  app.post("/auth/logout", async (_request, reply) => {
    reply.clearCookie(COOKIE_NAME, { path: "/" });
    return reply.send({ ok: true });
  });
}

export function registerAuthRoutes(
  app: FastifyInstance,
  handlers: AuthHandlers,
): void {
  app.get("/auth/me", async (request, reply) => {
    const result = await handlers.getMe.execute(request.ctx);
    if (!result.ok) {
      const httpErr = domainErrorToHttp(result.error);
      return reply.status(httpErr.statusCode).send(httpErr.body);
    }
    return { user: result.value };
  });
}
