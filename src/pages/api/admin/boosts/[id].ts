import type { APIRoute } from 'astro';
import { badRequest, forbidden, handleApiError, unauthorized } from '../../../../lib/errors';
import { json } from '../../../../lib/dashboard/server';
import { writeAdminAuditLog } from '../../../../server/services/admin-audit.service';
import { stopBoostCampaignByAdmin } from '../../../../server/services/boost.service';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    if (!locals.user) throw unauthorized();
    if (locals.user.role !== 'admin') throw forbidden('Admin access required');
    const campaignId = params.id || '';
    if (!campaignId) throw badRequest('INVALID_BOOST_CAMPAIGN', 'Campaign id is required.');
    const body = await request.json();
    if (body?.action !== 'stop') throw badRequest('INVALID_BOOST_ACTION', 'Unsupported Boost admin action.');
    const reason = String(body?.reason || '').trim();
    if (!reason) throw badRequest('BOOST_STOP_REASON_REQUIRED', 'A moderation reason is required.');
    const campaign = await stopBoostCampaignByAdmin(campaignId, reason);
    await writeAdminAuditLog({
      actorUserId: locals.user.id,
      action: 'boost.campaign_stopped',
      targetType: 'boost_campaign',
      targetId: campaign.id,
      metadata: { shopId: campaign.shopId, dealId: campaign.dealId, reason },
    });
    return json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};
