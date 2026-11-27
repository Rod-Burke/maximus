/**
 * Shared Media Capture, S3 Direct Upload, Gemini OCR & Private Lightbox Helper
 * Used by both Saint Max PWA (index.html / app.js) and M2M Studio (warchart.html / warchart.js).
 */
(function (global) {
    'use strict';

    const MEDIA_ENDPOINT = 'https://xbrhqaztkqtlruocvwal.supabase.co/functions/v1/media-ingest';
    const signedUrlCache = new Map(); // key: "bucket:s3_key" -> { url, expiresAt }

    function getAuthKey() {
        return localStorage.getItem('maximus_session_token') || (global.CONFIG && global.CONFIG.KEY) || '';
    }

    async function callMediaApi(payload) {
        const key = getAuthKey();
        const res = await fetch(MEDIA_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-brain-key': key
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.error) {
            throw new Error(data.error || `Media API failed (${res.status})`);
        }
        return data;
    }

    /**
     * Loads a File/Blob into an HTMLImageElement, then produces:
     *  - thumbBlob: <= 480px WebP (~25-50 KB) for fast gallery thumbnails
     *  - analysisBase64: <= 1600px JPEG (~150-250 KB) for Gemini multimodal OCR/Vision
     *  - width, height: natural pixel dimensions of the full-res original
     */
    function prepareImageForUpload(file) {
        return new Promise((resolve, reject) => {
            const objectUrl = URL.createObjectURL(file);
            const img = new Image();
            img.onload = async () => {
                try {
                    const origW = img.naturalWidth || img.width;
                    const origH = img.naturalHeight || img.height;

                    const renderScaled = (maxDim, mime, quality) => new Promise((resBlob) => {
                        const scale = Math.min(1, maxDim / Math.max(origW, origH, 1));
                        const w = Math.max(1, Math.round(origW * scale));
                        const h = Math.max(1, Math.round(origH * scale));
                        const canvas = document.createElement('canvas');
                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, w, h);
                        canvas.toBlob((blob) => resBlob(blob), mime, quality);
                    });

                    // 1. Thumbnail (WebP, fallback JPEG if browser doesn't encode WebP)
                    let thumbBlob = await renderScaled(480, 'image/webp', 0.80);
                    if (!thumbBlob || thumbBlob.type !== 'image/webp') {
                        thumbBlob = await renderScaled(480, 'image/jpeg', 0.80);
                    }

                    // 2. Analysis copy for Gemini OCR (1600px JPEG preserves small text cleanly)
                    const analysisBlob = await renderScaled(1600, 'image/jpeg', 0.85);
                    const analysisBase64 = await new Promise((resB64, rejB64) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const result = String(reader.result || '');
                            resB64(result.includes(',') ? result.split(',')[1] : result);
                        };
                        reader.onerror = rejB64;
                        reader.readAsDataURL(analysisBlob);
                    });

                    URL.revokeObjectURL(objectUrl);
                    resolve({
                        originalFile: file,
                        thumbBlob,
                        analysisBase64,
                        analysisMime: 'image/jpeg',
                        width: origW,
                        height: origH,
                        sizeBytes: file.size || 0,
                        filename: file.name || `capture-${Date.now()}.jpg`,
                        mimeType: file.type || 'image/jpeg'
                    });
                } catch (err) {
                    URL.revokeObjectURL(objectUrl);
                    reject(err);
                }
            };
            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Could not decode image file.'));
            };
            img.src = objectUrl;
        });
    }

    /**
     * Full end-to-end capture flow:
     *  1. Browser prepares thumbnail + Gemini OCR copy
     *  2. If !textOnly: presigns S3 PUT URLs & uploads full-res + thumb directly to private S3
     *  3. Calls media-ingest analyze_and_save (Gemini Vision OCR + Supabase pgvector + S3 link)
     */
    async function uploadAndAnalyzeMedia({
        file,
        bucket = 'maximus',
        userNote = '',
        textOnly = false,
        attachToId = null,
        appendOcrToResearch = false,
        onStatus = null
    }) {
        const report = (msg) => { if (typeof onStatus === 'function') onStatus(msg); };

        report('Preparing image & thumbnail…');
        const prepared = await prepareImageForUpload(file);

        let presigned = null;
        if (!textOnly) {
            report(`Uploading full-res to private S3 (${bucket === 'm2m' ? 'M2M' : 'Maximus'})…`);
            presigned = await callMediaApi({
                action: 'presign_upload',
                bucket,
                filename: prepared.filename,
                mime_type: prepared.mimeType,
                episode_id: attachToId || undefined
            });

            const [origPut, thumbPut] = await Promise.all([
                fetch(presigned.orig_put_url, {
                    method: 'PUT',
                    body: prepared.originalFile,
                    headers: { 'Content-Type': prepared.mimeType }
                }),
                fetch(presigned.thumb_put_url, {
                    method: 'PUT',
                    body: prepared.thumbBlob,
                    headers: { 'Content-Type': prepared.thumbBlob.type || 'image/webp' }
                })
            ]);

            if (!origPut.ok) throw new Error(`S3 original upload failed (${origPut.status})`);
            if (!thumbPut.ok) throw new Error(`S3 thumbnail upload failed (${thumbPut.status})`);
        }

        report('Running Gemini Vision OCR & vectorizing…');
        const result = await callMediaApi({
            action: 'analyze_and_save',
            bucket,
            attachment_id: presigned?.attachment_id,
            orig_key: presigned?.orig_key,
            thumb_key: presigned?.thumb_key,
            image_base64: prepared.analysisBase64,
            mime_type: prepared.analysisMime,
            filename: prepared.filename,
            size_bytes: prepared.sizeBytes,
            width: prepared.width,
            height: prepared.height,
            user_note: userNote,
            text_only: textOnly,
            attach_to_id: attachToId,
            append_ocr_to_research: appendOcrToResearch,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
        });

        // Warm local signed URL cache
        const now = Date.now();
        if (result.attachment?.s3_key && result.signed_orig_url) {
            signedUrlCache.set(`${result.attachment.bucket}:${result.attachment.s3_key}`, {
                url: result.signed_orig_url,
                expiresAt: now + 50 * 60 * 1000
            });
        }
        if (result.attachment?.thumb_key && result.signed_thumb_url) {
            signedUrlCache.set(`${result.attachment.bucket}:${result.attachment.thumb_key}`, {
                url: result.signed_thumb_url,
                expiresAt: now + 50 * 60 * 1000
            });
        }

        report('Saved!');
        return result;
    }

    /**
     * Fetches (and caches for 50 min) short-lived presigned GET URLs for an array of attachments.
     */
    async function resolveSignedUrls(attachments) {
        if (!Array.isArray(attachments) || attachments.length === 0) return {};
        const now = Date.now();
        const needed = [];
        const out = {};

        for (const att of attachments) {
            const scope = att.bucket === 'm2m' ? 'm2m' : 'maximus';
            for (const key of [att.thumb_key, att.s3_key]) {
                if (!key) continue;
                const cacheKey = `${scope}:${key}`;
                const cached = signedUrlCache.get(cacheKey);
                if (cached && cached.expiresAt > now) {
                    out[cacheKey] = cached.url;
                } else {
                    needed.push({ bucket: scope, key });
                }
            }
        }

        if (needed.length > 0) {
            const resp = await callMediaApi({ action: 'sign_urls', items: needed });
            const urls = resp.urls || {};
            for (const [k, u] of Object.entries(urls)) {
                signedUrlCache.set(k, { url: u, expiresAt: now + 50 * 60 * 1000 });
                out[k] = u;
            }
        }
        return out;
    }

    async function deleteAttachment(thoughtId, attachmentId) {
        return await callMediaApi({
            action: 'delete_attachment',
            thought_id: thoughtId,
            attachment_id: attachmentId
        });
    }

    /**
     * Shared full-screen lightbox for inspecting full-resolution S3 images + OCR text.
     */
    function openLightbox({ origUrl, title, description, ocrText, filename }) {
        let overlay = document.getElementById('maximus-media-lightbox');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'maximus-media-lightbox';
            overlay.style.cssText = [
                'position:fixed', 'inset:0', 'z-index:99999',
                'background:rgba(8,10,18,0.92)', 'backdrop-filter:blur(8px)',
                'display:flex', 'flex-direction:column', 'align-items:center', 'justify-content:center',
                'padding:20px', 'gap:12px', 'overflow:auto'
            ].join(';');
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.remove();
            });
            document.body.appendChild(overlay);
        }

        const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

        overlay.innerHTML = `
            <div style="width:min(1100px,96vw); max-height:92vh; display:flex; flex-direction:column; gap:12px; background:#141826; border:1px solid rgba(255,255,255,0.14); border-radius:14px; padding:16px; color:#f1f5f9; overflow:auto;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
                    <div>
                        <div style="font-weight:600; font-size:1.05rem;">${esc(title || filename || 'Image')}</div>
                        ${filename ? `<div style="font-size:0.78rem; color:#94a3b8;">${esc(filename)}</div>` : ''}
                    </div>
                    <div style="display:flex; gap:8px;">
                        <a href="${esc(origUrl)}" target="_blank" rel="noopener" style="padding:6px 12px; border-radius:8px; background:rgba(56,189,248,0.16); color:#7dd3fc; text-decoration:none; font-size:0.84rem; border:1px solid rgba(56,189,248,0.35);">Open Full-Res ↗</a>
                        <button type="button" id="mm-lb-close" style="padding:6px 12px; border-radius:8px; background:rgba(255,255,255,0.08); color:#f1f5f9; border:1px solid rgba(255,255,255,0.16); cursor:pointer;">✕ Close</button>
                    </div>
                </div>
                <div style="display:flex; justify-content:center; background:#090c14; border-radius:10px; padding:8px; max-height:62vh; overflow:auto;">
                    <img src="${esc(origUrl)}" alt="${esc(title || filename)}" style="max-width:100%; max-height:58vh; object-fit:contain; border-radius:6px;">
                </div>
                ${description ? `<div style="font-size:0.88rem; color:#cbd5e1;"><strong>Visual:</strong> ${esc(description)}</div>` : ''}
                ${ocrText ? `<details open style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:10px;"><summary style="cursor:pointer; font-weight:600; font-size:0.86rem; color:#a5b4fc;">📄 Extracted OCR Text</summary><pre style="white-space:pre-wrap; font-family:inherit; font-size:0.84rem; color:#e2e8f0; margin:8px 0 0; max-height:220px; overflow:auto;">${esc(ocrText)}</pre></details>` : ''}
            </div>
        `;
        overlay.querySelector('#mm-lb-close')?.addEventListener('click', () => overlay.remove());
    }

    global.MaximusMedia = {
        MEDIA_ENDPOINT,
        prepareImageForUpload,
        uploadAndAnalyzeMedia,
        resolveSignedUrls,
        deleteAttachment,
        openLightbox
    };
})(window);
