export interface NavLink {
  name: string;
  path: string;
  authRequired?: boolean; // if true, only shown when user is logged in
}

// Public routes - visible to everyone
export const publicNavLinks: NavLink[] = [
  { name: "Home", path: "/" },
  { name: "Community", path: "/community" },
  { name: "Jumuiya", path: "/jumuiya" },
  { name: "Officials", path: "/officials" },
  { name: "Gallery", path: "/gallery" },
  { name: "Devotion", path: "/devotions" },
];

// Auth-only routes - visible when logged in
export const authNavLinks: NavLink[] = [
  { name: "Projects", path: "/projects" },
  { name: "Activities", path: "/activities" },
];
