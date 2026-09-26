import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { io as connect } from "socket.io-client";
import { startTestEnv } from "./helpers.js";

let env;
const sockets = [];

before(async () => {
  env = await startTestEnv({ socket: true });
});
after(async () => {
  sockets.forEach((s) => s.close());
  await env.stop();
});

const open = (token) =>
  new Promise((resolve, reject) => {
    const socket = connect(env.baseUrl, { auth: { token }, transports: ["websocket"], reconnection: false });
    sockets.push(socket);
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", reject);
  });

const nextEvent = (socket, event, timeoutMs = 3000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out waiting for "${event}"`)), timeoutMs);
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });

describe("socket authentication", () => {
  it("rejects connections without a valid token", async () => {
    await assert.rejects(open("garbage"), /Unauthorized/);
    await assert.rejects(open(""), /Unauthorized/);
  });

  it("rejects suspended users", async () => {
    const user = await env.signup({ email: "c-susp@test.com" });
    await env.models.User.updateOne({ _id: user.id }, { isSuspended: true });
    await assert.rejects(open(user.token), /Unauthorized/);
  });

  it("accepts the auth cookie as well as an explicit token", async () => {
    const user = await env.signup({ email: "c-cookie@test.com" });
    const socket = await new Promise((resolve, reject) => {
      const s = connect(env.baseUrl, { transports: ["websocket"], reconnection: false, extraHeaders: { cookie: `accessToken=${user.token}` } });
      sockets.push(s);
      s.on("connect", () => resolve(s));
      s.on("connect_error", reject);
    });
    assert.ok(socket.connected);
  });
});

describe("messaging rules", () => {
  it("only connects job seekers and employers who share an application", async () => {
    const employer = await env.makeEmployer({ email: "c-emp1@test.com" });
    const linked = await env.makeSeeker({ email: "c-seek1@test.com" });
    const stranger = await env.makeSeeker({ email: "c-seek2@test.com" });
    const job = await env.makeJob(employer);
    await env.applyTo(linked, job);

    const send = (from, to, content) => env.api.post("/api/messages/chat").set(env.auth(from.token)).send({ to: to.id, content });

    assert.equal((await send(stranger, employer, "hi")).status, 403); // never applied
    assert.equal((await send(employer, stranger, "hi")).status, 403);
    assert.equal((await send(linked, linked, "hi")).status, 403); // self
    assert.equal((await send(linked, stranger, "hi")).status, 403); // seeker to seeker
    assert.equal((await send(employer, linked, "Welcome")).status, 201);
    assert.equal((await send(linked, employer, "Thanks")).status, 201);

    // Validation
    assert.equal((await send(employer, linked, "   ")).status, 400);
    assert.equal((await send(employer, linked, "x".repeat(2001))).status, 400);
    assert.equal((await env.api.post("/api/messages/chat").set(env.auth(employer.token)).send({ to: "abc", content: "hi" })).status, 400);
  });

  it("allows a reply once someone has written first", async () => {
    const employer = await env.makeEmployer({ email: "c-emp2@test.com" });
    const seeker = await env.makeSeeker({ email: "c-seek3@test.com" });
    await env.models.Message.create({ from: employer.id, to: seeker.id, type: "general", subject: "Hello", content: "Hi there" });
    const res = await env.api.post("/api/messages/chat").set(env.auth(seeker.token)).send({ to: employer.id, content: "Hello back" });
    assert.equal(res.status, 201);
  });
});

describe("real-time delivery", () => {
  let employer, seeker, empSocket, seekSocket;

  before(async () => {
    employer = await env.makeEmployer({ email: "r-emp@test.com", name: "Erin Employer" });
    seeker = await env.makeSeeker({ email: "r-seek@test.com", name: "Sam Seeker" });
    await env.applyTo(seeker, await env.makeJob(employer));
    empSocket = await open(employer.token);
    seekSocket = await open(seeker.token);
  });

  it("pushes a new chat message to the recipient instantly and echoes it to the sender", async () => {
    const incoming = nextEvent(seekSocket, "message:new");
    const echo = nextEvent(empSocket, "message:sent");

    const res = await env.api.post("/api/messages/chat").set(env.auth(employer.token)).send({ to: seeker.id, content: "Are you free to chat?" });
    assert.equal(res.status, 201);

    const message = await incoming;
    assert.equal(message.content, "Are you free to chat?");
    assert.equal(message.from.name, "Erin Employer");
    assert.equal((await echo)._id, message._id);
  });

  it("does not spam the bell while the recipient is online and watching live chat", async () => {
    const count = await env.models.Notification.countDocuments({ user: seeker.id, type: "message" });
    assert.equal(count, 0);
  });

  it("relays typing indicators only to the addressed user", async () => {
    const typing = nextEvent(seekSocket, "typing");
    empSocket.emit("typing", { to: seeker.id, isTyping: true });
    assert.deepEqual(await typing, { from: employer.id, isTyping: true });

    // Emitting typing to yourself is ignored
    let leaked = false;
    empSocket.once("typing", () => (leaked = true));
    empSocket.emit("typing", { to: employer.id, isTyping: true });
    await new Promise((r) => setTimeout(r, 200));
    assert.equal(leaked, false);
  });

  it("reports online status and updates watchers when someone disconnects/reconnects", async () => {
    const state = await new Promise((resolve) => empSocket.emit("presence:watch", [seeker.id, "0".repeat(24)], resolve));
    assert.deepEqual(state.online, [seeker.id]);

    const offline = nextEvent(empSocket, "presence:update");
    seekSocket.close();
    assert.deepEqual(await offline, { userId: seeker.id, online: false });

    const online = nextEvent(empSocket, "presence:update");
    seekSocket = await open(seeker.token);
    assert.deepEqual(await online, { userId: seeker.id, online: true });

    const list = await env.api.get("/api/messages/conversations").set(env.auth(employer.token));
    assert.equal(list.body.data.conversations[0].online, true);
  });

  it("keeps presence when a user has several tabs and only goes offline when the last closes", async () => {
    const second = await open(seeker.token);
    const updates = [];
    empSocket.on("presence:update", (u) => updates.push(u));
    second.close();
    await new Promise((r) => setTimeout(r, 300));
    assert.deepEqual(updates, []); // the first tab is still connected
    empSocket.off("presence:update");
  });

  it("creates one aggregated notification when the recipient is offline", async () => {
    seekSocket.close();
    await new Promise((r) => setTimeout(r, 200));
    for (const content of ["ping 1", "ping 2", "ping 3"]) {
      await env.api.post("/api/messages/chat").set(env.auth(employer.token)).send({ to: seeker.id, content });
    }
    const notes = await env.models.Notification.find({ user: seeker.id, type: "message" });
    assert.equal(notes.length, 1);
    assert.match(notes[0].message, /ping 3/);
    assert.equal(notes[0].link, `/messages?chat=${employer.id}`);
  });

  it("lists conversations with last message and unread counts; opening a thread marks it read", async () => {
    const list = await env.api.get("/api/messages/conversations").set(env.auth(seeker.token));
    assert.equal(list.status, 200);
    const convo = list.body.data.conversations[0];
    assert.equal(convo.user.name, "Erin Employer");
    assert.equal(convo.unread, 4);
    assert.equal(convo.lastMessage.content, "ping 3");

    seekSocket = await open(seeker.token);
    const read = nextEvent(empSocket, "message:read");
    const thread = await env.api.get(`/api/messages/conversation/${employer.id}`).set(env.auth(seeker.token));
    assert.equal(thread.status, 200);
    assert.deepEqual(thread.body.data.messages.map((m) => m.content), ["Are you free to chat?", "ping 1", "ping 2", "ping 3"]);
    assert.equal(thread.body.data.user.name, "Erin Employer");

    const receipt = await read;
    assert.equal(receipt.by, seeker.id);
    assert.equal(receipt.ids.length, 4);

    const again = await env.api.get("/api/messages/conversations").set(env.auth(seeker.token));
    assert.equal(again.body.data.conversations[0].unread, 0);
    const bell = await env.models.Notification.countDocuments({ user: seeker.id, type: "message", isRead: false });
    assert.equal(bell, 0);
  });

  it("returns 404 for a conversation with an unknown user", async () => {
    assert.equal((await env.api.get(`/api/messages/conversation/${"0".repeat(24)}`).set(env.auth(seeker.token))).status, 404);
  });
});

describe("notification push", () => {
  it("delivers notifications to the user's socket in real time", async () => {
    const employer = await env.makeEmployer({ email: "n-emp@test.com" });
    const seeker = await env.makeSeeker({ email: "n-seek@test.com", name: "Nora" });
    const job = await env.makeJob(employer);
    const socket = await open(employer.token);

    const pushed = nextEvent(socket, "notification:new");
    await env.applyTo(seeker, job);
    const note = await pushed;
    assert.equal(note.type, "application_received");
    assert.match(note.message, /Nora applied/);
  });
});
