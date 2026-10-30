export async function onRequestGet() {
  return Response.json({
    enabled: false,
    environment: null,
    productionEnabled: false,
    externalRequestsAllowed: false,
    networkRequestsMadeByStatusCheck: false,
    missingConfiguration: ['No provider adapter is deployed on the Pages demo'],
    notice: 'bKash is not connected. No provider request was made.'
  }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function onRequest({ request }) {
  return request.method === 'GET'
    ? onRequestGet()
    : Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405, headers: { Allow: 'GET' } });
}
