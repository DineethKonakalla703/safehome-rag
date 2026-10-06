import Vendor from '../models/Vendor.js';

const categoryMap = {
  Plumbing: ['plumb', 'pipe', 'leak', 'water', 'drain', 'tap', 'seepage'],
  Electrical: ['electric', 'switch', 'spark', 'power', 'light', 'wiring', 'voltage'],
  HVAC: ['ac', 'air conditioner', 'heating', 'ventilation', 'cooling'],
  Lift: ['lift', 'elevator'],
  Security: ['cctv', 'camera', 'guard', 'lock', 'access', 'barrier'],
  Carpentry: ['door', 'window', 'wood', 'furniture', 'cabinet'],
};

export function scoreVendor(vendor, ticket) {
  const text = `${ticket.title || ''} ${ticket.description || ''} ${ticket.category || ''}`.toLowerCase();
  const isEmergency = ['Critical', 'High'].includes(ticket.severity) || ticket.safetyRisk;
  let score = 0;
  const reasons = [];

  // Category matching (35 points)
  const keywords = categoryMap[vendor.category] || [vendor.category.toLowerCase()];
  const categoryMatch = keywords.some((kw) => text.includes(kw)) ||
    (ticket.category || '').toLowerCase().includes(vendor.category.toLowerCase());

  if (categoryMatch) {
    score += 35;
    reasons.push(`Specialized in ${vendor.category}`);
  } else {
    score += 10;
  }

  // Rating (20 points max)
  const ratingScore = Math.min(20, ((vendor.rating || 4) / 5) * 20);
  score += ratingScore;
  if ((vendor.rating || 4) >= 4.5) {
    reasons.push(`High customer rating (${vendor.rating}★)`);
  }

  // Current availability (15 points)
  if (vendor.available !== false) {
    score += 15;
    reasons.push('Currently available for immediate dispatch');
  }

  // Emergency availability (15 points)
  if (isEmergency && vendor.emergencyAvailable) {
    score += 15;
    reasons.push('Certified for 24/7 emergency response');
  } else if (vendor.emergencyAvailable) {
    score += 5;
  }

  // Cost efficiency (up to 10 points for affordable rates)
  const hourlyRate = vendor.hourlyRate || 500;
  const costScore = Math.max(0, Math.min(10, 10 - ((hourlyRate - 300) / 100)));
  score += costScore;
  if (hourlyRate <= 500) {
    reasons.push(`Competitive rate (₹${hourlyRate}/hr)`);
  }

  // Warranty & experience (up to 5 points)
  if ((vendor.warrantyPeriodMonths || 0) >= 3) {
    score += 3;
    reasons.push(`${vendor.warrantyPeriodMonths}-month service warranty`);
  }
  if ((vendor.completedJobsCount || 0) > 10) {
    score += 2;
  }

  const finalScore = Math.round(Math.min(100, Math.max(10, score)));
  return {
    score: finalScore,
    reason: reasons.join(' · ') || 'Active local registered vendor.',
  };
}

export async function recommendVendors(ticket) {
  const vendors = await Vendor.find({
    communityId: ticket.communityId,
    status: 'Active',
  }).lean();

  if (!vendors.length) {
    return [];
  }

  const scored = vendors.map((vendor) => {
    const { score, reason } = scoreVendor(vendor, ticket);
    return {
      vendorId: vendor.vendorId,
      name: vendor.name,
      category: vendor.category,
      phone: vendor.phone,
      rating: vendor.rating,
      hourlyRate: vendor.hourlyRate,
      score,
      emergencyAvailable: vendor.emergencyAvailable,
      warrantyMonths: vendor.warrantyPeriodMonths,
      reason,
      generatedAt: new Date(),
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 5);
}
