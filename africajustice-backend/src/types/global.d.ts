import type { Server } from 'socket.io'

declare global {
  interface GlobalThis {
    io?: Server
  }

  namespace NodeJS {
    interface Global {
      io?: Server
    }
  }
}

export {}
