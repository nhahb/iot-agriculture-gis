import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { Sprout } from "lucide-react";
import { Link } from "react-router-dom";

export default function SidebarHeaderContent() {
  return (
    <SidebarHeader className="border-b border-zinc-800 bg-zinc-950 p-3">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            asChild
            className="
              h-12 rounded-xl px-2
              text-zinc-100
              transition-colors
              hover:bg-zinc-900
              hover:text-white
            "
          >
            <Link to="/dashboard">
              {/* Logo */}
              <div
                className="
                  flex size-9 shrink-0 items-center justify-center
                  rounded-xl bg-emerald-500
                  text-zinc-950
                  shadow-sm shadow-emerald-500/20
                "
              >
                <Sprout className="size-5" />
              </div>

              {/* App information */}
              <div className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold text-zinc-100">
                  AgriMonitor
                </span>

                <span className="truncate text-xs text-zinc-500">
                  IoT Agriculture System
                </span>
              </div>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}