import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  ClipboardList,
  Shield,
  Settings,
  Users,
  Briefcase,
  LineChart,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  roles?: string[];
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const navigationConfig: NavGroup[] = [
  {
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Investment",
    items: [
      {
        label: "Buyside",
        href: "/dashboard/buyside",
        icon: LineChart,
      },
      {
        label: "Funds",
        href: "/dashboard/funds",
        icon: Briefcase,
      },
      {
        label: "Portfolio",
        href: "/dashboard/portfolio",
        icon: BarChart3,
      },
      {
        label: "Orders",
        href: "/dashboard/orders",
        icon: ClipboardList,
        badge: "38",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Compliance",
        href: "/dashboard/compliance",
        icon: Shield,
      },
      {
        label: "Operations",
        href: "/dashboard/operations",
        icon: TrendingUp,
      },
    ],
  },
  {
    label: "Admin",
    items: [
      {
        label: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
      },
      {
        label: "Users & Roles",
        href: "/dashboard/settings/users",
        icon: Users,
        roles: ["admin", "super_admin"],
      },
    ],
  },
];
