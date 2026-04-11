import Fastify from "fastify";
import { resolveConfig, type AppConfig } from "./config.js";
import { DatabaseClient } from "./db/database.js";
import { listModeMetadata } from "./domain/gameModes.js";
import type { DartResult, GameModeId } from "./domain/types.js";
import { NotFoundError, SessionService } from "./services/sessionService.js";

const validDarts: DartResult[] = ["S", "D", "T", "OTHER", "MISS"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseTargetSegment = (value: unknown) => {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 20) {
    return null;
  }

  return value;
};

const parseOptionalModeId = (value: unknown) => {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === "string" ? (value as GameModeId) : null;
};

const parseDart = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }

  return validDarts.includes(value as DartResult) ? (value as DartResult) : null;
};

export const buildApp = async (overrides: Partial<AppConfig> = {}) => {
  const config = resolveConfig(overrides);
  const db = new DatabaseClient(config.dbFile);
  const service = new SessionService(db);
  const app = Fastify({ logger: false });

  app.addHook("onClose", async () => {
    db.close();
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof NotFoundError) {
      reply.status(404).send({ error: error.message });
      return;
    }

    reply.status(500).send({ error: "Internal server error" });
  });

  app.get("/health", async () => ({
    status: "ok",
  }));

  app.get("/api/v1/meta/modes", async () => ({
    modes: listModeMetadata(),
  }));

  app.post("/api/v1/sessions", async (request, reply) => {
    const body = isRecord(request.body) ? request.body : {};
    const modeId = parseOptionalModeId(body.modeId);
    const targetSegment = body.targetSegment === undefined ? undefined : parseTargetSegment(body.targetSegment);
    const playerId = typeof body.playerId === "string" ? body.playerId : undefined;

    if (modeId === null || (modeId !== undefined && !service.isValidMode(modeId))) {
      reply.status(400).send({ error: "modeId must be a valid game mode." });
      return;
    }

    if (body.targetSegment !== undefined && targetSegment === null) {
      reply.status(400).send({ error: "targetSegment must be an integer from 1 to 20." });
      return;
    }

    reply.status(201).send(
      service.createSession({
        playerId,
        modeId,
        targetSegment: targetSegment ?? undefined,
      }),
    );
  });

  app.get("/api/v1/sessions/:sessionId", async (request) => {
    const params = request.params as { sessionId: string };
    return service.getSession(params.sessionId);
  });

  app.post("/api/v1/sessions/:sessionId/darts", async (request, reply) => {
    const params = request.params as { sessionId: string };
    const body = isRecord(request.body) ? request.body : null;
    const dart = body ? parseDart(body.dart) : null;

    if (!dart) {
      reply.status(400).send({ error: "dart must be one of S, D, T, OTHER, or MISS." });
      return;
    }

    return service.addDart(params.sessionId, dart);
  });

  app.post("/api/v1/sessions/:sessionId/advance", async (request) => {
    const params = request.params as { sessionId: string };
    return service.advanceSession(params.sessionId);
  });

  app.post("/api/v1/sessions/:sessionId/undo", async (request) => {
    const params = request.params as { sessionId: string };
    return service.undoSession(params.sessionId);
  });

  app.post("/api/v1/sessions/:sessionId/reset", async (request) => {
    const params = request.params as { sessionId: string };
    return service.resetSession(params.sessionId);
  });

  app.get("/api/v1/players/:playerId/sessions", async (request) => {
    const params = request.params as { playerId: string };
    return {
      sessions: service.listPlayerSessions(params.playerId),
    };
  });

  return { app, config };
};
