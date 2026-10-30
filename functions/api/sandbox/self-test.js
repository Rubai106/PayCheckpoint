export async function onRequestPost() {
  return Response.json({
    error: 'LOCAL_LAB_ONLY',
    message: 'The synthetic integration lab runs in the local Node development environment only. It is not presented as a hosted provider test.'
  }, { status: 501, headers: { 'Cache-Control': 'no-store' } });
}
export async function onRequest({ request }) {
  return request.method === 'POST'
    ? onRequestPost()
    : Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405, headers: { Allow: 'POST' } });
}
