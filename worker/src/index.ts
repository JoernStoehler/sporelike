export default {
  async fetch(_request: Request): Promise<Response> {
    return Response.json({
      status: 'ok',
      message: 'Sporelike API - placeholder',
    })
  },
} satisfies ExportedHandler
