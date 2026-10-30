export async function onRequestPost() {
  return Response.json({
    error: 'PROVIDER_INTEGRATION_NOT_DEPLOYED',
    message: 'This public demo has no authorized bKash adapter. No provider request was made.'
  }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
}
export async function onRequest({ request }) {
  return request.method === 'POST'
    ? onRequestPost()
    : Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405, headers: { Allow: 'POST' } });
}
