import { app } from '../elysia'

const handler = (request: Request) => app.handle(request)

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH }