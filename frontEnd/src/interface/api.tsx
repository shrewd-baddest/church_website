export interface ChurchAPISuccessResponseInterface {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  message: string;
  statusCode: number;
  success: boolean;
}

// imported to church_website\frontEnd\src\pages\Devotions\pages\NotificationPage.tsx
export interface Event {
  id: string;
  text: string;
  category: "jumuiya" | "csa";
  posted_by: string;
  createdAt: string;
  read: boolean;
  images?: string[]; // optional image URLs
}
export interface Props {
  isAdmin: boolean;
  events: Event[];
}

// imported to church_website\frontEnd\src\pages\Devotions\csaComparison\CsaComparison.tsx
export interface JumuiData {
  _id: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
}

// imported to church_website\frontEnd\src\pages\Devotions\individualStatus\IndividualProgress.tsx
export interface WeekData {
  _id: number;
  totalAttempts: number;
  correctAttempts: number;
}

// imported to church_website\frontEnd\src\pages\Devotions\individualStatus\IndividualProgress.tsx
export interface Summary {
  totalAttempts: number;
  correctAttempts: number;
}

// imported to church_website\frontEnd\src\pages\Devotions\jumuiyaStatus\JumuiyaDashboard.tsx
export interface JumuiyaStats {
  jumuiyaId: string;
  totalAttempts: number;
  correctAttempts: number;
}
export interface DashboardProps {
  jumuiyaId: string;
}
