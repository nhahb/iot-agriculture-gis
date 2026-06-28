import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { navItems } from "@/components/layout/navItems";
import { Link, useLocation } from "react-router-dom";

export default function SidebarMainMenu() {
  const location = useLocation();

  const isItemActive = (url) => {
    if (url === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    return (
      location.pathname === url ||
      location.pathname.startsWith(`${url}/`)
    );
  };

  return (
    <SidebarContent className="bg-zinc-950 px-2">
      <SidebarGroup className="py-4">
        <SidebarGroupLabel className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-zinc-600">
          Menu
        </SidebarGroupLabel>

        <SidebarMenu className="gap-1">
          {navItems.map((item) => {
            const active = isItemActive(item.url);

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  className="
                    h-10 rounded-lg px-3
                    text-zinc-400
                    transition-all duration-200
                    hover:bg-zinc-800/80
                    hover:text-zinc-100
                    data-[active=true]:bg-emerald-500/10
                    data-[active=true]:font-medium
                    data-[active=true]:text-emerald-400
                    data-[active=true]:hover:bg-emerald-500/15
                    data-[active=true]:hover:text-emerald-300
                  "
                >
                  <Link to={item.url}>
                    <item.icon
                      className={`size-4 shrink-0 ${
                        active
                          ? "text-emerald-400"
                          : "text-zinc-500"
                      }`}
                    />

                    <span>{item.title}</span>

                    {active && (
                      <span className="ml-auto size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
}