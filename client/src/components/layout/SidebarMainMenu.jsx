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
import {
  useNotificationContext,
} from "@/context/NotificationContext";

export default function SidebarMainMenu() {
  const location = useLocation();

  const { unreadCount } =
    useNotificationContext();

  const isItemActive = (url) => {
    if (url === "/dashboard") {
      return (
        location.pathname === "/dashboard"
      );
    }

    return (
      location.pathname === url ||
      location.pathname.startsWith(
        `${url}/`
      )
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
            const active =
              isItemActive(item.url);

            const isNotificationItem =
              item.url ===
              "/user/notifications";

            return (
              <SidebarMenuItem
                key={item.url}
              >
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
                  <Link
                    to={item.url}
                    className="flex w-full items-center gap-2"
                  >
                    <item.icon
                      className={`
                        size-4 shrink-0
                        ${
                          active
                            ? "text-emerald-400"
                            : "text-zinc-500"
                        }
                      `}
                    />

                    <span className="min-w-0 flex-1 truncate">
                      {item.title}
                    </span>

                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      {isNotificationItem &&
                        unreadCount > 0 && (
                          <span
                            aria-label={`${unreadCount} thông báo chưa đọc`}
                            className="
                              flex min-w-5 items-center
                              justify-center rounded-full
                              bg-red-500 px-1.5 py-0.5
                              text-[10px] font-semibold
                              leading-none text-white
                              shadow-sm shadow-red-500/20
                            "
                          >
                            {unreadCount > 99
                              ? "99+"
                              : unreadCount}
                          </span>
                        )}

                      {active && (
                        <span
                          className="
                            size-1.5 rounded-full
                            bg-emerald-400
                            shadow-[0_0_8px_rgba(52,211,153,0.7)]
                          "
                        />
                      )}
                    </div>
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
