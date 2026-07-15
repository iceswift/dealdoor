export const prerender = false;

import type { APIRoute } from 'astro';
import { getDashboardContext } from '../../../lib/dashboard/server';
import { getUnreadCount } from '../../../server/services/notification.service';

export const GET: APIRoute = async ({ locals, request }) => {
  if (!locals.user) return new Response('Unauthorized', { status: 401 });

  const context = await getDashboardContext(locals.user);
  const scope = { userId: locals.user.id, shopId: context?.shop?.id };
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = async () => {
        if (closed) return;
        try {
          const unreadCount = await getUnreadCount(scope);
          controller.enqueue(encoder.encode(`event: inbox\ndata: ${JSON.stringify({ unreadCount })}\n\n`));
        } catch {
          controller.enqueue(encoder.encode('event: error\ndata: {"message":"inbox unavailable"}\n\n'));
        }
      };

      controller.enqueue(encoder.encode('retry: 30000\n\n'));
      await send();
      timer = setInterval(() => void send(), 25_000);
    },
    cancel() {
      closed = true;
      if (timer) clearInterval(timer);
    },
  });

  request.signal.addEventListener('abort', () => {
    closed = true;
    if (timer) clearInterval(timer);
  }, { once: true });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};
