// SafeHome brand tokens — ink navy, brushed brass, warm ivory (matches the web app).
export const colors = {
  ink: '#0F1A2C',
  ink2: '#16233A',
  ink3: '#22355A',
  brass: '#B8924A',
  brassLight: '#C9A45C',
  brassDeep: '#8A6A2C',
  brassSoft: '#F4ECDC',
  ivory: '#F5F3EE',
  surface: '#FFFFFF',
  surfaceMuted: '#F8F6F2',
  border: '#E8E4DC',
  borderStrong: '#D9D4CA',
  text: '#161C2B',
  textSoft: '#4D5464',
  muted: '#6B7180',
  faint: '#9DA1AB',
  onInk: '#F5F1E8',
  onInkMuted: '#A8AFBB',
  success: '#047857',
  successSoft: '#E4F4EC',
  warning: '#B45309',
  warningSoft: '#FDF1DE',
  danger: '#B91C1C',
  dangerSoft: '#FDECEC',
  sos: '#C81E1E',
  info: '#1F3A64',
  infoSoft: '#E9EEF6',
};

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayMedium: 'Fraunces_500Medium',
  displayItalic: 'Fraunces_500Medium_Italic',
  body: 'Manrope_500Medium',
  bodyRegular: 'Manrope_400Regular',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  heavy: 'Manrope_800ExtraBold',
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };
export const space = (n) => n * 4;

export const shadow = {
  card: { shadowColor: '#141821', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  lift: { shadowColor: '#0F1A2C', shadowOpacity: 0.18, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
};

// Status → tone used by badges across the app.
const TONES = {
  success: ['Resolved', 'Closed', 'Paid', 'Approved', 'Collected', 'Completed', 'Going', 'Active', 'On Track', 'Exited', 'Open'],
  warning: ['Pending', 'In Progress', 'Medium', 'Acknowledged', 'At Gate', 'Due Soon', 'Maybe', 'Scheduled', 'Expected'],
  danger: ['High', 'Critical', 'Overdue', 'Rejected', 'Failed', 'False Alarm', 'Blacklisted', 'Inside'],
  info: ['New', 'Assigned', 'Move-In', 'Move-Out'],
};
export function toneFor(value) {
  const v = String(value || '');
  if (v === 'Active' || v === 'Open') return 'success';
  for (const [tone, list] of Object.entries(TONES)) if (list.includes(v)) return tone;
  return 'neutral';
}
export const toneColors = {
  success: [colors.successSoft, colors.success],
  warning: [colors.warningSoft, colors.warning],
  danger: [colors.dangerSoft, colors.danger],
  info: [colors.infoSoft, colors.info],
  neutral: ['#EFECE6', colors.textSoft],
  brass: [colors.brassSoft, colors.brassDeep],
};
