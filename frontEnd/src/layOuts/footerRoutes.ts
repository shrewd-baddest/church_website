import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";

export const footerSocialMedia = [
  { icon: FaFacebookF,  url: "https://facebook.com/csa_kirinyaga",          name: "Facebook",  color: "text-blue-600",   hoverBg: "hover:bg-blue-600"   },
  { icon: FaTwitter,    url: "https://twitter.com/csa_kirinyaga",           name: "Twitter",   color: "text-sky-500",    hoverBg: "hover:bg-sky-500"    },
  { icon: FaInstagram,  url: "https://instagram.com/csa_kirinyaga",         name: "Instagram", color: "text-pink-500",   hoverBg: "hover:bg-gradient-to-br hover:from-yellow-400 hover:via-pink-500 hover:to-purple-600" },
  { icon: FaLinkedinIn, url: "https://linkedin.com/company/csa_kirinyaga",  name: "LinkedIn",  color: "text-blue-700",  hoverBg: "hover:bg-blue-700"   },
];

export interface FooterRoute {
  label: string;
  path: string;
}

export interface FooterSection {
  title: string;
  hoverColor: string;
  routes: FooterRoute[];
}

export const footerSections: FooterSection[] = [
  {
    title: "Institutional",
    hoverColor: "hover:text-blue-600",
    routes: [
      { label: "Officials", path: "/officials" },
      { label: "Leadership History", path: "/officials/history" },
      { label: "Jumuiya Hub", path: "/jumuiya" },
    ],
  },
  {
    title: "Daily Devotion",
    hoverColor: "hover:text-amber-600",
    routes: [
      { label: "Daily Readings", path: "/devotions/readings" },
      { label: "Prayer Room", path: "/devotions/prayer" },
      { label: "Rosary Tracker", path: "/devotions/rosary" },
      { label: "Faith Challenge", path: "/devotions/challenge" },
    ],
  },
  {
    title: "Community",
    hoverColor: "hover:text-green-600",
    routes: [
      { label: "Community Hub", path: "/community" },
      { label: "Latest Updates", path: "/Notification" },
      { label: "Member Portal", path: "/login" },
    ],
  },
];
