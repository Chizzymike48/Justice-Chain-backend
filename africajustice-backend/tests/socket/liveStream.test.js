const { setupLiveStreamHandlers } = require("../../src/socket/liveStream");
const {
  normalizeStreamId,
  getRoomName,
  joinStream,
  leaveStream,
  getViewerCount,
} = require("../../src/services/liveStreamService");

const createMockIo = () => {
  const io = {
    sockets: {
      adapter: {
        rooms: new Map(),
      },
    },
    to: jest.fn(),
    emit: jest.fn(),
  };

  io.to.mockImplementation(() => io);
  return io;
};

const createMockSocket = (io, id = "socket-1") => {
  const handlers = {};
  const socket = {
    id,
    rooms: new Set([id]),
    on: jest.fn((event, handler) => {
      handlers[event] = handler;
    }),
    join: jest.fn((room) => {
      socket.rooms.add(room);
      const members = io.sockets.adapter.rooms.get(room) || new Set();
      members.add(id);
      io.sockets.adapter.rooms.set(room, members);
    }),
    leave: jest.fn((room) => {
      socket.rooms.delete(room);
      const members = io.sockets.adapter.rooms.get(room);
      if (members) {
        members.delete(id);
        if (members.size === 0) {
          io.sockets.adapter.rooms.delete(room);
        } else {
          io.sockets.adapter.rooms.set(room, members);
        }
      }
    }),
  };

  return { socket, handlers };
};

describe("live stream service", () => {
  it("normalizes valid stream ids and rejects invalid ones", () => {
    expect(normalizeStreamId("stream-123")).toBe("stream-123");
    expect(normalizeStreamId("  stream_abc  ")).toBe("stream_abc");
    expect(normalizeStreamId("bad id")).toBeNull();
    expect(normalizeStreamId("")).toBeNull();
    expect(normalizeStreamId(null)).toBeNull();
  });

  it("tracks viewer counts on join and leave", () => {
    const io = createMockIo();
    const { socket } = createMockSocket(io);
    const streamId = "stream-123";
    const room = getRoomName(streamId);

    const joinResult = joinStream(io, socket, streamId);
    expect(joinResult.room).toBe(room);
    expect(getViewerCount(io, room)).toBe(1);

    const leaveResult = leaveStream(io, socket, streamId);
    expect(leaveResult.room).toBe(room);
    expect(getViewerCount(io, room)).toBe(0);
  });
});

describe("live stream socket handlers", () => {
  it("emits viewer count on join and leave", () => {
    const io = createMockIo();
    const { socket, handlers } = createMockSocket(io);

    setupLiveStreamHandlers(io, socket);

    handlers["livestream:join"]("stream-123");
    expect(io.to).toHaveBeenCalledWith("livestream:stream-123");
    expect(io.emit).toHaveBeenCalledWith("livestream:viewer-count", {
      streamId: "stream-123",
      count: 1,
    });

    handlers["livestream:leave"]("stream-123");
    expect(io.to).toHaveBeenLastCalledWith("livestream:stream-123");
    expect(io.emit).toHaveBeenLastCalledWith("livestream:viewer-count", {
      streamId: "stream-123",
      count: 0,
    });
  });

  it("ignores invalid stream ids", () => {
    const io = createMockIo();
    const { socket, handlers } = createMockSocket(io);

    setupLiveStreamHandlers(io, socket);

    handlers["livestream:join"]("bad id");
    handlers["livestream:leave"]("bad id");

    expect(io.to).not.toHaveBeenCalled();
    expect(io.emit).not.toHaveBeenCalled();
  });

  it("emits updated viewer count on disconnect", () => {
    const io = createMockIo();
    const { socket, handlers } = createMockSocket(io);

    setupLiveStreamHandlers(io, socket);

    handlers["livestream:join"]("stream-123");

    const room = "livestream:stream-123";
    const members = io.sockets.adapter.rooms.get(room);
    members.delete(socket.id);
    if (members.size === 0) {
      io.sockets.adapter.rooms.delete(room);
    } else {
      io.sockets.adapter.rooms.set(room, members);
    }

    handlers["disconnect"]();

    expect(io.to).toHaveBeenLastCalledWith(room);
    expect(io.emit).toHaveBeenLastCalledWith("livestream:viewer-count", {
      streamId: "stream-123",
      count: 0,
    });
  });
});
