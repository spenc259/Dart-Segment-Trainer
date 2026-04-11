import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildApp } from "./app.js";

const createTempDbPath = async () => {
  const dir = await mkdtemp(join(tmpdir(), "dartscorer-backend-"));
  return {
    dir,
    dbFile: join(dir, "test.db"),
  };
};

test("creates a session, persists a scored visit, and lists player sessions", async () => {
  const { dir, dbFile } = await createTempDbPath();
  const { app } = await buildApp({ dbFile });

  try {
    const createResponse = await app.inject({
      method: "POST",
      url: "/api/v1/sessions",
      payload: {
        modeId: "standard",
        targetSegment: 20,
      },
    });

    assert.equal(createResponse.statusCode, 201);

    const createPayload = createResponse.json() as {
      player: { id: string };
      session: { id: string };
    };

    const sessionId = createPayload.session.id;
    const playerId = createPayload.player.id;

    for (const dart of ["S", "D", "T"]) {
      const dartResponse = await app.inject({
        method: "POST",
        url: `/api/v1/sessions/${sessionId}/darts`,
        payload: { dart },
      });

      assert.equal(dartResponse.statusCode, 200);
    }

    const sessionResponse = await app.inject({
      method: "GET",
      url: `/api/v1/sessions/${sessionId}`,
    });

    assert.equal(sessionResponse.statusCode, 200);

    const session = sessionResponse.json() as {
      score: number;
      visitsPlayed: number;
      history: Array<{ perfect: boolean; darts: string[] }>;
      stats: { accuracyPercent: number; visitSuccessRate: number };
    };

    assert.equal(session.visitsPlayed, 1);
    assert.equal(session.score, 3);
    assert.equal(session.history[0]?.perfect, true);
    assert.deepEqual(session.history[0]?.darts, ["S", "D", "T"]);
    assert.equal(session.stats.accuracyPercent, 100);
    assert.equal(session.stats.visitSuccessRate, 100);

    const playerSessionsResponse = await app.inject({
      method: "GET",
      url: `/api/v1/players/${playerId}/sessions`,
    });

    assert.equal(playerSessionsResponse.statusCode, 200);
    const playerSessions = playerSessionsResponse.json() as {
      sessions: Array<{ id: string; score: number }>;
    };

    assert.equal(playerSessions.sessions.length, 1);
    assert.equal(playerSessions.sessions[0]?.id, sessionId);
    assert.equal(playerSessions.sessions[0]?.score, 3);
  } finally {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("advance and undo work without depending on the frontend", async () => {
  const { dir, dbFile } = await createTempDbPath();
  const { app } = await buildApp({ dbFile });

  try {
    const createResponse = await app.inject({
      method: "POST",
      url: "/api/v1/sessions",
      payload: {
        modeId: "standard",
        targetSegment: 20,
      },
    });

    const { session } = createResponse.json() as { session: { id: string } };

    const firstDart = await app.inject({
      method: "POST",
      url: `/api/v1/sessions/${session.id}/darts`,
      payload: { dart: "S" },
    });

    assert.equal(firstDart.statusCode, 200);

    const advanceResponse = await app.inject({
      method: "POST",
      url: `/api/v1/sessions/${session.id}/advance`,
    });

    assert.equal(advanceResponse.statusCode, 200);

    const advancedSession = advanceResponse.json() as {
      visitsPlayed: number;
      totalDarts: number;
      score: number;
      currentVisit: string[];
    };

    assert.equal(advancedSession.visitsPlayed, 1);
    assert.equal(advancedSession.totalDarts, 3);
    assert.equal(advancedSession.score, 0);
    assert.deepEqual(advancedSession.currentVisit, []);

    const undoResponse = await app.inject({
      method: "POST",
      url: `/api/v1/sessions/${session.id}/undo`,
    });

    assert.equal(undoResponse.statusCode, 200);

    const undoneSession = undoResponse.json() as {
      visitsPlayed: number;
      totalDarts: number;
      history: unknown[];
    };

    assert.equal(undoneSession.visitsPlayed, 0);
    assert.equal(undoneSession.totalDarts, 0);
    assert.equal(undoneSession.history.length, 0);
  } finally {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("file-backed sessions survive app restarts", async () => {
  const { dir, dbFile } = await createTempDbPath();
  const first = await buildApp({ dbFile });

  let sessionId = "";

  try {
    const createResponse = await first.app.inject({
      method: "POST",
      url: "/api/v1/sessions",
      payload: {
        modeId: "precision",
        targetSegment: 20,
      },
    });

    sessionId = (createResponse.json() as { session: { id: string } }).session.id;

    await first.app.inject({
      method: "POST",
      url: `/api/v1/sessions/${sessionId}/darts`,
      payload: { dart: "T" },
    });

    await first.app.inject({
      method: "POST",
      url: `/api/v1/sessions/${sessionId}/darts`,
      payload: { dart: "S" },
    });

    await first.app.inject({
      method: "POST",
      url: `/api/v1/sessions/${sessionId}/darts`,
      payload: { dart: "OTHER" },
    });
  } finally {
    await first.app.close();
  }

  const second = await buildApp({ dbFile });

  try {
    const sessionResponse = await second.app.inject({
      method: "GET",
      url: `/api/v1/sessions/${sessionId}`,
    });

    assert.equal(sessionResponse.statusCode, 200);

    const session = sessionResponse.json() as {
      visitsPlayed: number;
      score: number;
      history: Array<{ success: boolean }>;
    };

    assert.equal(session.visitsPlayed, 1);
    assert.equal(session.score, 1);
    assert.equal(session.history[0]?.success, true);
  } finally {
    await second.app.close();
    await rm(dir, { recursive: true, force: true });
  }
});
