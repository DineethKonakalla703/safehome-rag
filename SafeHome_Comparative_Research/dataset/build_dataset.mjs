// Builds the SYNTHETIC maintenance CRM graph and the 60-question evaluation set.
// Deterministic: re-running produces byte-identical output (seeded PRNG, fixed dates).
// Usage: node dataset/build_dataset.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOCUMENTS } from './corpus_documents.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let seed = 42;
const rand = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

// ---------- Graph: blocks, apartments, technicians ----------
const BLOCKS = ['A', 'B', 'C'];
const apartments = [];
for (const b of BLOCKS) for (let f = 1; f <= 5; f += 1) for (let n = 1; n <= 3; n += 1) {
  const id = `${b}-${f}0${n}`;
  apartments.push({ apartmentId: id, block: b, floor: f, stack: n, above: f < 5 ? `${b}-${f + 1}0${n}` : null, below: f > 1 ? `${b}-${f - 1}0${n}` : null });
}
const technicians = [
  { technicianId: 'TEC01', name: 'Ramesh Kumar', skill: 'Plumbing', blocks: ['A', 'B'], senior: false },
  { technicianId: 'TEC02', name: 'Suresh Rao', skill: 'Electrical', blocks: ['A', 'B'], senior: false },
  { technicianId: 'TEC03', name: 'Imran Shaikh', skill: 'Plumbing', blocks: ['C', 'A'], senior: true },
  { technicianId: 'TEC04', name: 'Priya Nair', skill: 'HVAC', blocks: ['A', 'B', 'C'], senior: false },
  { technicianId: 'TEC05', name: 'Joseph Fernandes', skill: 'Carpentry', blocks: ['A', 'B', 'C'], senior: false },
  { technicianId: 'TEC06', name: 'Anil Verma', skill: 'Electrical', blocks: ['C', 'B'], senior: true },
  { technicianId: 'TEC07', name: 'Kavitha Reddy', skill: 'Appliances', blocks: ['A', 'B', 'C'], senior: false },
  { technicianId: 'TEC08', name: 'Mohan Das', skill: 'Water Leakage', blocks: ['A', 'B', 'C'], senior: true },
];

const ISSUES = {
  Plumbing: [['Kitchen sink draining very slowly', 'Cleared grease from the sink trap and flushed the line'], ['Bathroom tap dripping even when fully closed', 'Replaced the tap cartridge'], ['Toilet flush tank keeps running after use', 'Replaced the flush valve seal'], ['Pipe under the wash basin leaking onto the floor', 'Replaced a cracked PVC coupling'], ['Bathroom floor trap blocked with bad smell', 'Rodded the floor trap and fitted an anti-odour cap']],
  Electrical: [['Bedroom MCB trips again and again', 'Found damaged insulation on the bedroom circuit and rewired it'], ['Living room fan regulator not working', 'Replaced the fan regulator'], ['Sparks from the kitchen power socket', 'Replaced the burnt socket and tightened loose terminals'], ['Mild shock felt from the geyser body', 'Repaired the earthing connection and tested earth resistance'], ['Half the lights in the flat stopped working', 'Reset and replaced a faulty MCB in the distribution board']],
  HVAC: [['Bedroom air conditioner blowing warm air', 'Cleaned choked filters and recharged refrigerant after leak repair'], ['Water dripping from the indoor AC unit', 'Flushed the blocked condensate drain line'], ['AC outdoor unit making a rattling noise', 'Tightened the fan mount and replaced vibration pads'], ['AC does not switch on with the remote', 'Replaced the indoor unit receiver board']],
  'Water Leakage': [['Damp patch spreading on the bedroom ceiling', 'Traced seepage to the bathroom above and redid its waterproofing'], ['Seepage on the external wall during rain', 'Sealed exterior plaster cracks and window sealant'], ['Water leaking from the balcony slab into the room below', 'Applied a polyurethane membrane to the balcony floor'], ['Bathroom ceiling wet with peeling paint', 'Replaced grout and waterproofed the bathroom floor above']],
  Appliances: [['Geyser making a banging noise', 'Descaled the tank and replaced the thermostat'], ['Washing machine inlet hose leaking', 'Replaced the inlet hose and washer'], ['Kitchen exhaust fan stopped working', 'Replaced the exhaust fan capacitor']],
  Carpentry: [['Main door does not close properly', 'Adjusted the door closer and tightened hinges'], ['Wardrobe hinge broken', 'Replaced two soft-close hinges'], ['Sliding balcony door is stuck', 'Cleaned the track and replaced rollers']],
};
const CATS = Object.keys(ISSUES);
const techFor = (cat, block, preferSenior = false) => {
  const pool = technicians.filter((t) => t.skill === cat && t.blocks.includes(block));
  return (preferSenior && pool.find((t) => t.senior)) || pool[0] || technicians.find((t) => t.skill === cat);
};
const day = (n) => new Date(Date.UTC(2026, 0, 1) + n * 86400000).toISOString().slice(0, 10);

const tickets = [];
const addTicket = (apartmentId, category, issueIdx, dayN, tech) => {
  const apt = apartments.find((a) => a.apartmentId === apartmentId);
  const [issue, fix] = ISSUES[category][issueIdx % ISSUES[category].length];
  const t = tech || techFor(category, apt.block);
  tickets.push({ ticketId: `TKH${String(tickets.length + 1).padStart(3, '0')}`, apartmentId, block: apt.block, floor: apt.floor, category, issue, resolution: fix, technicianId: t.technicianId, technicianName: t.name, reportedOn: day(dayN), resolvedOn: day(dayN + 1 + Math.floor(rand() * 3)) });
};

// Planted scenarios (so multi-hop and recurring-issue questions have clear answers).
addTicket('A-203', 'Plumbing', 0, 40); addTicket('A-203', 'Plumbing', 3, 72); addTicket('A-203', 'Plumbing', 3, 95); addTicket('A-203', 'Plumbing', 4, 118, technicians[2]);
addTicket('C-402', 'Plumbing', 1, 150); addTicket('C-402', 'Plumbing', 3, 171); addTicket('C-402', 'Plumbing', 0, 205);
addTicket('B-303', 'Water Leakage', 3, 130); addTicket('A-403', 'Water Leakage', 0, 160); addTicket('C-303', 'Water Leakage', 2, 188);
addTicket('B-502', 'Water Leakage', 0, 145); addTicket('A-302', 'Water Leakage', 3, 210); addTicket('C-203', 'Water Leakage', 1, 230);
addTicket('B-201', 'Electrical', 3, 60); addTicket('B-201', 'Electrical', 0, 200, technicians[5]);
addTicket('A-103', 'HVAC', 0, 120);
// Random history.
const randomApts = apartments.filter((a) => !['A-203', 'C-402'].includes(a.apartmentId));
for (let i = 0; i < 64; i += 1) {
  const apt = pick(randomApts); const cat = pick(CATS);
  addTicket(apt.apartmentId, cat, Math.floor(rand() * 5), Math.floor(rand() * 300));
}
tickets.sort((a, b) => a.reportedOn.localeCompare(b.reportedOn) || a.ticketId.localeCompare(b.ticketId));
tickets.forEach((t, i) => { t.ticketId = `TKH${String(i + 1).padStart(3, '0')}`; });

// ---------- Retrieval units (what a text retriever indexes) ----------
const ticketText = (t) => `Ticket ${t.ticketId} for apartment ${t.apartmentId} (Block ${t.block}, floor ${t.floor}). Category: ${t.category}. Reported on ${t.reportedOn}: ${t.issue}. Resolved on ${t.resolvedOn} by technician ${t.technicianName} (${t.technicianId}): ${t.resolution}.`;
const aptText = (a) => `Apartment ${a.apartmentId} is on floor ${a.floor} of Block ${a.block}.${a.above ? ` It is directly below apartment ${a.above}.` : ' It is a top-floor apartment under the terrace.'}${a.below ? ` It is directly above apartment ${a.below}.` : ''}`;
const techText = (t) => `Technician ${t.name} (${t.technicianId}) handles ${t.skill} work in Block ${t.blocks.join(' and Block ')}${t.senior ? ' and is a senior technician' : ''}.`;
const units = [
  ...DOCUMENTS.map((d) => ({ unitId: d.documentId, kind: 'document', origin: d.origin, title: d.title, text: d.content })),
  ...tickets.map((t) => ({ unitId: t.ticketId, kind: 'ticket', origin: 'synthetic', title: `Ticket ${t.ticketId}`, text: ticketText(t) })),
  ...apartments.map((a) => ({ unitId: `APT-${a.apartmentId}`, kind: 'apartment', origin: 'synthetic', title: `Apartment ${a.apartmentId}`, text: aptText(a) })),
  ...technicians.map((t) => ({ unitId: t.technicianId, kind: 'technician', origin: 'synthetic', title: t.name, text: techText(t) })),
];

// ---------- Questions ----------
const Q = [];
const add = (type, question, gold, answer, note = '') => Q.push({ qid: `${type}${String(Q.filter((q) => q.type === type).length + 1).padStart(2, '0')}`, type, question, gold, answer, note });

// F: simple factual retrieval (lexical overlap with the source)
add('F', 'What are the quiet hours in the society?', ['KDOC005'], '10:00 PM');
add('F', 'By which date are monthly maintenance bills due?', ['KDOC007'], '10th');
add('F', 'How far in advance can residents book the community hall?', ['KDOC006'], '30 days');
add('F', 'How often are overhead water tanks cleaned?', ['KDOC108'], 'six months');
add('F', 'On which day is general pest control done in common areas?', ['KDOC114'], 'first Saturday');
add('F', 'How quickly must the lift vendor respond to entrapment calls?', ['KDOC117'], '30 minutes');
add('F', 'What is the response target for critical requests such as gas smell or lift entrapment?', ['KDOC116'], 'one-hour');
add('F', 'How often must RO purifier filters be replaced?', ['KDOC118'], 'six months');
add('F', 'What is the late fee for maintenance payments made after the 20th?', ['KDOC007'], '₹50 per week');
add('F', 'During which hours can heavy furniture be moved with the service lift?', ['KDOC122'], '9:00 AM and 6:00 PM');

// S: semantic retrieval (paraphrased, little word overlap)
add('S', 'My cooling unit is on but the bedroom still feels hot — what should I look at first?', ['KDOC102'], 'filter');
add('S', 'I can smell cooking fuel in my kitchen. What do I do right now?', ['KDOC111'], 'gas meter valve');
add('S', 'I got a tingle touching the metal faucet. Is that dangerous?', ['KDOC110'], 'earthing');
add('S', 'Somebody is stuck inside the elevator between floors.', ['KDOC003'], 'never force lift doors');
add('S', 'There are brownish wet marks on my ceiling that keep growing.', ['KDOC107'], 'directly above');
add('S', 'The hot water storage tank in the bathroom is making loud knocking sounds.', ['KDOC103'], 'switch it off');
add('S', 'Whole flat has no electricity but the neighbours are fine.', ['KDOC109'], 'distribution board');
add('S', 'Every sink in our vertical line is gurgling and dirty water is coming back up.', ['KDOC106'], 'soil stack');
add('S', 'Why does my fridge freeze up at the back and stop chilling food?', ['KDOC105'], 'defrost heater');
add('S', 'Upstairs flats get only a trickle from the taps in the evening.', ['KDOC121'], 'pressure pump');

// H: historical ticket retrieval (gold computed from ticket history)
const PHRASE = { Plumbing: 'plumbing', Electrical: 'electrical', HVAC: 'air-conditioning', 'Water Leakage': 'water seepage or leakage', Appliances: 'appliance', Carpentry: 'door or carpentry' };
const histCandidates = [];
for (const a of apartments) for (const c of CATS) {
  const ts = tickets.filter((t) => t.apartmentId === a.apartmentId && t.category === c);
  if (ts.length) histCandidates.push({ a: a.apartmentId, c, ts });
}
const histPicked = [];
for (const want of [['A-203', 'Plumbing'], ['B-201', 'Electrical'], ['A-103', 'HVAC']]) histPicked.push(histCandidates.find((h) => h.a === want[0] && h.c === want[1]));
while (histPicked.length < 10) { const h = pick(histCandidates); if (!histPicked.includes(h) && !histPicked.some((p) => p.a === h.a)) histPicked.push(h); }
for (const h of histPicked) {
  const latest = h.ts[h.ts.length - 1];
  add('H', `Has apartment ${h.a} had ${PHRASE[h.c]} problems before, and who fixed the most recent one?`, h.ts.map((t) => t.ticketId), latest.technicianName, `${h.ts.length} matching ticket(s)`);
}

// M: multi-document reasoning over the knowledge base
add('M', 'Water from a burst pipe is running near the corridor electrical panel. What should the team do?', ['KDOC001', 'KDOC002'], 'isolate');
add('M', 'A resident reports the same kitchen leak for the fourth time this quarter. How should it be handled and how fast?', ['KDOC115', 'KDOC116'], 'senior technician');
add('M', 'The fire alarm is ringing — can residents take the lift, and what should they do if someone is trapped in it?', ['KDOC113', 'KDOC003'], 'staircases');
add('M', 'The geyser keeps tripping the RCCB and the bathroom tap gives a mild shock. Which checks apply?', ['KDOC103', 'KDOC110'], 'insulation resistance');
add('M', 'A top-floor flat has ceiling seepage after the first monsoon rain. What is the likely cause and when is the roof inspected?', ['KDOC107', 'KDOC108'], 'May');
add('M', 'During a power cut, which services keep running and what should a resident check if only their flat is dark when power returns?', ['KDOC112', 'KDOC109'], 'MCB');
add('M', 'When is the AC in common areas serviced, and what does a standard AC service include?', ['KDOC120', 'KDOC101'], 'condensate drain');
add('M', 'Can a resident move a new refrigerator in at 8 PM, and will the society repair it if it stops cooling?', ['KDOC122', 'KDOC105'], '6:00 PM');
add('M', 'Water is collecting under the washing machine and the floor trap smells. Who repairs what?', ['KDOC104', 'KDOC106'], 'brand service centre');
add('M', 'Tap water turned yellow on the day the tanks were cleaned. Is that expected and whom should I tell?', ['KDOC118', 'KDOC108'], 'report');

// G: multi-hop graph reasoning (relations: directly above, technician, recurrence, aggregation)
const leakAbove = apartments.filter((a) => a.above && tickets.some((t) => t.apartmentId === a.above && t.category === 'Water Leakage'));
const chosenAbove = [];
for (const a of leakAbove) { if (chosenAbove.length < 6 && !chosenAbove.some((c) => c.block === a.block && c.floor === a.floor)) chosenAbove.push(a); }
for (const a of chosenAbove) {
  const ts = tickets.filter((t) => t.apartmentId === a.above && t.category === 'Water Leakage');
  const last = ts[ts.length - 1];
  add('G', `There is a damp patch on the ceiling of ${a.apartmentId}. Who fixed the most recent leakage in the flat directly above it?`, [`APT-${a.apartmentId}`, last.ticketId], last.technicianName, `hop: ${a.apartmentId} -> above ${a.above} -> ${last.ticketId} -> ${last.technicianName}`);
}
const recurring = apartments.map((a) => {
  for (const c of CATS) {
    const ts = tickets.filter((t) => t.apartmentId === a.apartmentId && t.category === c).map((t) => Date.parse(t.reportedOn));
    for (let i = 0; i + 2 < ts.length; i += 1) if (ts[i + 2] - ts[i] <= 90 * 86400000) return { a: a.apartmentId, c };
  }
  return null;
}).filter(Boolean);
for (const r of recurring.slice(0, 2)) {
  const ts = tickets.filter((t) => t.apartmentId === r.a && t.category === r.c);
  add('G', `Does apartment ${r.a} qualify as a recurring ${PHRASE[r.c]} issue under the escalation policy, and who should handle it next?`, ['KDOC115', ...ts.map((t) => t.ticketId)], 'senior technician', `${ts.length} ${r.c} tickets; policy KDOC115`);
}
for (const [cat, block] of [['HVAC', 'B'], ['Electrical', 'C']]) {
  const ts = tickets.filter((t) => t.category === cat && t.block === block);
  const counts = {}; ts.forEach((t) => { counts[t.technicianName] = (counts[t.technicianName] || 0) + 1; });
  const top = Object.entries(counts).sort((x, y) => y[1] - x[1])[0];
  add('G', `Which technician has handled the most ${PHRASE[cat]} tickets in Block ${block}?`, ts.map((t) => t.ticketId), top ? top[0] : '', `aggregation over ${ts.length} tickets`);
}
while (Q.filter((q) => q.type === 'G').length < 10) { // top up with technician-coverage hops if fewer scenarios exist
  const a = pick(apartments); const t = techFor('Electrical', a.block, true);
  add('G', `Which senior electrician covers the block of apartment ${a.apartmentId}?`, [`APT-${a.apartmentId}`, t.technicianId], t.name, 'hop: apartment -> block -> technician');
}

// U: unanswerable (not in the corpus)
add('U', 'What is the chlorine dosing schedule for the swimming pool?', [], null);
add('U', 'How much does the society charge for a second covered car parking slot?', [], null);
add('U', 'Which solar panel vendor maintains the rooftop solar plant?', [], null);
add('U', 'What is the Wi-Fi password for the clubhouse?', [], null);
add('U', 'When was apartment D-101 last painted?', [], null);
add('U', 'Who is the treasurer of the residents welfare association this year?', [], null);
add('U', 'What is the procedure for EV charger installation in the basement?', [], null);
add('U', 'Which technician repaired the intercom in Block E?', [], null);
add('U', 'How many CCTV cameras cover the main gate?', [], null);
add('U', 'What is the penalty for overstaying guest parking beyond 48 hours?', [], null);

// ---------- Validation: every answerable question's answer must appear in its gold evidence ----------
const unitById = new Map(units.map((u) => [u.unitId, u]));
const problems = [];
for (const q of Q) {
  for (const g of q.gold) if (!unitById.has(g)) problems.push(`${q.qid}: unknown gold unit ${g}`);
  if (q.answer && !q.gold.some((g) => unitById.get(g)?.text.toLowerCase().includes(q.answer.toLowerCase()))) problems.push(`${q.qid}: answer "${q.answer}" not found in gold evidence`);
  if (q.type !== 'U' && !q.gold.length) problems.push(`${q.qid}: answerable question without gold`);
}

writeFileSync(join(here, 'graph.json'), JSON.stringify({ apartments, technicians, tickets }, null, 2));
writeFileSync(join(here, 'units.json'), JSON.stringify(units, null, 2));
writeFileSync(join(here, 'questions.json'), JSON.stringify(Q, null, 2));
const byType = Q.reduce((m, q) => ({ ...m, [q.type]: (m[q.type] || 0) + 1 }), {});
console.log(JSON.stringify({ units: units.length, documents: DOCUMENTS.length, tickets: tickets.length, apartments: apartments.length, technicians: technicians.length, questions: Q.length, byType, problems }, null, 1));
