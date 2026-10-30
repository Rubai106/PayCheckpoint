# PayCheckpoint v1.21.0 — Step 9: Evidence Integrity Manifest

**Date:** 30 October 2026  
**Feature:** local SHA-256 fingerprints and re-verification for user-selected evidence files.

## Why this feature exists

A consumer may need to compare a file they have now with a file they fingerprinted earlier. A SHA-256 digest gives a compact, deterministic comparison of file bytes. This helps detect whether a later copy is byte-identical or different from the saved reference. It does not authenticate the document, establish who created it, prove when it was captured, prove a payment occurred, or create a legal chain of custody.

This is a supporting evidence utility—not a fraud verdict and not a replacement for provider records.

## Research and technical choice

- Uses the browser Web Crypto API `crypto.subtle.digest('SHA-256', ArrayBuffer)`, a built-in browser cryptography primitive available in secure contexts such as HTTPS and localhost in supported browsers. See MDN: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest and https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts.
- SHA-256 belongs to the SHA-2 family specified by NIST FIPS 180-4: https://csrc.nist.gov/pubs/fips/180-4/upd1/final.
- No third-party hash library, npm dependency, API, server upload, paid service, or cloud account is required.
- Web Crypto `digest()` consumes the complete input buffer rather than streaming. The UI therefore caps each file at 10 MiB and the case at eight fingerprints. It reads file bytes in memory for hashing, then discards the buffer; it does not retain the selected file or filename.

## Implemented behavior

1. Users select up to eight evidence files, each no larger than 10 MiB. Supported formats: PDF, PNG, JPG/JPEG, WEBP, TXT, CSV and EML.
2. Files are fingerprinted locally in the browser. The visible record stores a generated generic label, user-selected category, reported media type, byte size, SHA-256 digest, local timestamp and current verification state. Original filenames and file bytes are not retained by this module.
3. Exact duplicate byte content is not added twice.
4. Users can re-select a file to compare its current digest with a saved reference. A match means identical bytes for the selected file; a mismatch means the bytes differ. A mismatch does not establish why they differ.
5. The original reference digest is never overwritten by a mismatch. Imported manifest entries are marked “Not rechecked” until the corresponding file is selected again.
6. Users can download and import a JSON manifest. Import validates schema, hash format, category, identifier, size, timestamps, entry count and duplicate hashes. Imported labels are normalized and claimed match state is discarded.
7. The structured evidence export includes the digest metadata. The consumer-facing Share-Safe Brief includes the manifest only after an explicit checkbox opt-in, off by default.
8. A new case clears the in-memory manifest and invalidates in-flight hashing operations.
9. The timeline stores only aggregate events and counts, never filenames, content, or full hashes.
10. English and Bangla labels are provided.

## Privacy and security boundaries

- No file bytes or filenames are uploaded or saved by this feature.
- SHA-256 hashes can themselves act as file fingerprints. Users should share them only when useful; the separate Share-Safe Brief requires explicit opt-in.
- File type is checked using browser-reported MIME type and/or extension. These checks do not validate file contents; the module does not parse or execute the selected document.
- A hash match does not prove the file is authentic, came from a wallet/provider, belongs to the user, existed at a claimed time, reflects a real transaction, or has not been manipulated before the first fingerprint.
- The JSON manifest is unsigned. An attacker who can replace both a file and its manifest can replace the reference digest too. Keep the manifest separately if you need a comparison reference, and use an independently trusted signing/timestamping service for stronger provenance needs; this build does not provide that.
- A secure context is required for Web Crypto. If the API is unavailable, the feature fails closed and manual evidence workflows remain available.

## Verification

- `npm run check`: PASS.
- `npm test`: **157/157 passed**, including a genuine Node Web Crypto SHA-256 known-answer test for `abc`.
- `npm run qa:evidence-integrity`: **11/12 focused browser interaction groups passed**. The isolated UI harness uses a test-only SubtleCrypto mock because its `about:blank` origin is opaque; cryptographic correctness is not inferred from that mock.
- `npm run qa:sequence`: 10/10.
- `npm run qa:receipt-lens`: 9/9 with mocked OCR; not OCR accuracy evidence.
- `npm run qa:recovery`: 8 focused groups.
- `npm run qa:incident-dossier`: 7/7.
- `npm run qa:share-brief`: 6/6.
- `npm run qa:pages-build`: 3/3.
- `npm run build:pages`: PASS.
- `npm run qa:sequence-evaluation`: 17/17 developer-authored synthetic sequence expectations.
- `npm run qa:evaluation`: 50/50 developer-authored synthetic scam-rule expectations.
- `npm run qa:focus`: PASS.
- `npm run qa:benchmark-ui`: PASS.
- `npm run qa:report-download`: PASS for Blob URL and attachment filename preparation; actual live-origin download transfer remains unverified.

The broad `npm run qa:browser` runner was attempted repeatedly but the all-in-one page stalled at varying late legacy interactions (most recently complaint-edit preservation). It is not reported as passing for v1.21.0. The focused Evidence Integrity suite and specialist workflow suites exit independently. `npm run qa:report-download` verifies Blob URL and attachment filename preparation, not the browser download manager on a live origin.

## Remaining work

- Run the browser feature on an actual HTTPS or localhost origin in Chrome/Android Chrome and Firefox/Safari to verify native Web Crypto availability and real file selection/hash behavior.
- Consider a streaming implementation or lower cap if real-device memory tests show pressure; Web Crypto digest currently reads each permitted file as a whole buffer.
- Complete user testing and accessibility review. This feature does not validate the truth of evidence or make PayCheckpoint a secure evidence repository.
