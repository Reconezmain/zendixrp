export const DISCORD_INVITE = process.env.NEXT_PUBLIC_DISCORD_INVITE || 'https://discord.gg/zendixrp';
export const SERVER_CONNECT = process.env.NEXT_PUBLIC_SERVER_CONNECT || 'cfx.re/join/ler3lr5';

export const STAFF_GROUPS = [
  { value: 'OWNER', label: 'Ejer', color: 'yellow' },
  { value: 'MANAGEMENT', label: 'Ledelse', color: 'grape' },
  { value: 'DEVELOPER', label: 'Udvikling', color: 'cyan' },
  { value: 'ADMINISTRATOR', label: 'Administratorer', color: 'green' },
  { value: 'MODERATOR', label: 'Moderatorer', color: 'blue' },
  { value: 'SUPPORT', label: 'Support', color: 'gray' },
] as const;

export const MAP_CATEGORIES = ['Myndighed', 'Sundhed', 'Virksomhed', 'Mødested', 'Job', 'Garage', 'Andet'];

export type ApplicationQuestion = {
  id: string;
  label: string;
  description?: string;
  type: 'text' | 'textarea';
  required: boolean;
  minLength: number;
};

export type PublicApplicationType = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  questions: ApplicationQuestion[];
  reviewerRoleIds: string[];
  active: boolean;
  sortOrder: number;
};

export const STATUS_LABELS = {
  SENT: { label: 'Sendt', color: 'blue' },
  IN_REVIEW: { label: 'Under behandling', color: 'yellow' },
  APPROVED: { label: 'Godkendt', color: 'green' },
  REJECTED: { label: 'Afvist', color: 'red' },
} as const;
