'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DocumentModel, EMBED_MESSAGES, EmbedPrefillSchema, buildDocumentFromPrefill } from '@invoice/core';
import { DocumentBuilder } from '@/components/document/document-builder';

/**
 * The invoice editor for other sites to place in an iframe. See /dashboard/developers for the host's side.
 *
 * It never reads the visitor's workspace or saves locally. Invoice data only goes to the origin
 * that sent `invoxa:init`, so a page that merely frames this one receives nothing.
 */
export default function EmbedPage() {
  const hostOrigin = useRef<string | null>(null);
  const announced = useRef(false);
  const [start, setStart] = useState<{ key: number; document?: DocumentModel }>({ key: 0 });

  const sendToHost = useCallback((type: string, payload: object) => {
    if (hostOrigin.current) window.parent.postMessage({ type, ...payload }, hostOrigin.current);
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent || event.data?.type !== EMBED_MESSAGES.init) return;
      hostOrigin.current = event.origin;
      if (!event.data.document) return;
      const parsed = EmbedPrefillSchema.safeParse(event.data.document);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        sendToHost(EMBED_MESSAGES.error, { message: `${issue.path.join('.')}: ${issue.message}` });
        return;
      }
      setStart((current) => ({ key: current.key + 1, document: buildDocumentFromPrefill(parsed.data) }));
    };
    window.addEventListener('message', onMessage);
    if (window.parent !== window && !announced.current) {
      announced.current = true;
      window.parent.postMessage({ type: EMBED_MESSAGES.ready }, '*');
    }
    return () => window.removeEventListener('message', onMessage);
  }, [sendToHost]);

  const handleChange = useCallback(
    (document: DocumentModel) => sendToHost(EMBED_MESSAGES.change, { document }),
    [sendToHost]
  );
  const handleSaved = useCallback(
    (document: DocumentModel) => sendToHost(EMBED_MESSAGES.save, { document }),
    [sendToHost]
  );

  return (
    <DocumentBuilder
      key={start.key}
      embed
      initialDocument={start.document}
      onDocumentChange={handleChange}
      onSaved={handleSaved}
    />
  );
}
