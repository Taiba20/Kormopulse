import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestEnv } from "./helpers.js";

let env;
before(async () => {
  env = await startTestEnv();
});
after(async () => {
  await env.stop();
});

describe("saved job searches", () => {
  it("saves, lists, renames and deletes a search, scoped to its owner", async () => {
    const seeker = await env.makeSeeker({ email: "saver@test.com" });
    const other = await env.makeSeeker({ email: "other-saver@test.com" });

    const filters = { search: "react developer", location: "Dhaka", jobTypes: ["full-time"], workMode: ["remote"] };
    const create = await env.api
      .post("/api/saved-searches")
      .set(env.auth(seeker.token))
      .send({ name: "React remote roles", filters });
    assert.equal(create.status, 201);
    assert.equal(create.body.data.name, "React remote roles");
    assert.deepEqual(create.body.data.filters, filters);
    const id = create.body.data._id;

    const list = await env.api.get("/api/saved-searches").set(env.auth(seeker.token));
    assert.equal(list.status, 200);
    assert.equal(list.body.data.searches.length, 1);
    assert.equal(list.body.data.searches[0]._id, id);

    // Another job seeker sees none of it
    assert.equal((await env.api.get("/api/saved-searches").set(env.auth(other.token))).body.data.searches.length, 0);
    assert.equal((await env.api.patch(`/api/saved-searches/${id}`).set(env.auth(other.token)).send({ name: "Mine now" })).status, 404);
    assert.equal((await env.api.delete(`/api/saved-searches/${id}`).set(env.auth(other.token))).status, 404);

    const rename = await env.api.patch(`/api/saved-searches/${id}`).set(env.auth(seeker.token)).send({ name: "Renamed search" });
    assert.equal(rename.status, 200);
    assert.equal(rename.body.data.name, "Renamed search");

    const del = await env.api.delete(`/api/saved-searches/${id}`).set(env.auth(seeker.token));
    assert.equal(del.status, 200);
    assert.equal((await env.api.get("/api/saved-searches").set(env.auth(seeker.token))).body.data.searches.length, 0);
  });

  it("requires a name, accepts an empty filter set, and is job-seeker only", async () => {
    const seeker = await env.makeSeeker({ email: "saver2@test.com" });
    const employer = await env.makeEmployer({ email: "saver2-emp@test.com" });

    assert.equal((await env.api.post("/api/saved-searches").set(env.auth(seeker.token)).send({ filters: { search: "x" } })).status, 400);

    const noFilters = await env.api.post("/api/saved-searches").set(env.auth(seeker.token)).send({ name: "All jobs" });
    assert.equal(noFilters.status, 201);
    assert.deepEqual(noFilters.body.data.filters, {});

    assert.equal((await env.api.post("/api/saved-searches").set(env.auth(employer.token)).send({ name: "Nope" })).status, 403);
    assert.equal((await env.api.get("/api/saved-searches").set(env.auth(employer.token))).status, 403);
    assert.equal((await env.api.get("/api/saved-searches")).status, 401);
  });

  it("caps the number of saved searches per user", async () => {
    const seeker = await env.makeSeeker({ email: "saver3@test.com" });
    for (let i = 0; i < 20; i += 1) {
      const res = await env.api.post("/api/saved-searches").set(env.auth(seeker.token)).send({ name: `Search ${i}` });
      assert.equal(res.status, 201, `search ${i} failed`);
    }
    const overLimit = await env.api.post("/api/saved-searches").set(env.auth(seeker.token)).send({ name: "One too many" });
    assert.equal(overLimit.status, 400);
    assert.match(overLimit.body.message, /at most 20/);
  });

  it("returns 404 for an unknown or someone else's id on rename/delete", async () => {
    const seeker = await env.makeSeeker({ email: "saver4@test.com" });
    const fakeId = "0".repeat(24);
    assert.equal((await env.api.patch(`/api/saved-searches/${fakeId}`).set(env.auth(seeker.token)).send({ name: "x" })).status, 404);
    assert.equal((await env.api.delete(`/api/saved-searches/${fakeId}`).set(env.auth(seeker.token))).status, 404);
    assert.equal((await env.api.patch("/api/saved-searches/not-an-id").set(env.auth(seeker.token)).send({ name: "x" })).status, 400);
  });
});
