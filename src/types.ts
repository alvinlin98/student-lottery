export interface Student {
  id: string;
  name: string;
  gender: 'M' | 'F' | 'unknown';
  seatNumber?: string; // 座號
}

export interface ClassRoster {
  id: string;
  className: string;
  students: Student[];
  createdAt: number;
}

export interface TeamGroup {
  id: string;
  name: string;
  avatar: string; // E.g., emoji like 🦁, 🐼, etc.
  color: string;  // Background/text/border Tailwind color classes
  students: Student[];
}

export type GroupingMethod = 'byGroupCount' | 'byMemberCount';
export type BalancingMode = 'none' | 'gender';
