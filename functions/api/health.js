export async function onRequestGet() {
  return Response.json({
    ok: true,
    mode: 'cloudflare-pages-static',
    caseStorageAvailable: false,
    caseStorageMessage: 'Encrypted saved-case storage is not configured for this static Pages deployment. Cases remain in browser memory unless the user exports them.'
  }, { headers: { 'Cache-Control': 'no-store' } });
}
