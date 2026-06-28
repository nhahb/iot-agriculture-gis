import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Bell,
  ChevronsUpDown,
  CircleUserRound,
  LogOut,
  Settings,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "sonner";

import useLogout from "@/hooks/useLogout";
import useUser from "@/hooks/useUser";

export default function SidebarFooterContent() {
  const logout = useLogout();
  const { userData, getUser, axiosPrivate } = useUser();

  useEffect(() => {
    const loadInfo = async () => {
      try {
        await getUser();
      } catch (err) {
        console.error(err);
        toast.error("Không thể lấy thông tin người dùng");
      }
    };

    loadInfo();
  }, [axiosPrivate]);

  const userName = userData?.name || "Người dùng";
  const userEmail = userData?.email || "Chưa có email";
  const userInitial = userName.trim().charAt(0).toUpperCase() || "U";

  return (
    <SidebarFooter className="border-t border-zinc-800 bg-zinc-950 p-3">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="
                  h-auto rounded-xl border border-zinc-800
                  bg-zinc-900/60 px-3 py-2.5 text-zinc-100
                  transition-colors
                  hover:bg-zinc-800 hover:text-white
                  data-[state=open]:border-zinc-700
                  data-[state=open]:bg-zinc-800
                  data-[state=open]:text-white
                "
              >
                {/* Avatar */}
                <div
                  className="
                    flex size-9 shrink-0 items-center justify-center
                    rounded-lg bg-emerald-500
                    text-sm font-semibold text-zinc-950
                    shadow-sm shadow-emerald-500/20
                  "
                >
                  {userInitial}
                </div>

                {/* User information */}
                <div className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-medium text-zinc-100">
                    {userName}
                  </span>

                  <span className="truncate text-xs text-zinc-500">
                    {userEmail}
                  </span>
                </div>

                <ChevronsUpDown className="ml-auto size-4 shrink-0 text-zinc-500" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="top"
              align="end"
              sideOffset={10}
              className="
                w-[var(--radix-dropdown-menu-trigger-width)]
                min-w-60 rounded-xl border-zinc-800
                bg-zinc-950 p-1.5 text-zinc-100
                shadow-2xl shadow-black/40
              "
            >
              {/* User header */}
              <DropdownMenuLabel className="p-2 font-normal">
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex size-10 shrink-0 items-center justify-center
                      rounded-xl bg-emerald-500
                      font-semibold text-zinc-950
                    "
                  >
                    {userInitial}
                  </div>

                  <div className="grid min-w-0 flex-1 leading-tight">
                    <span className="truncate text-sm font-medium text-zinc-100">
                      {userName}
                    </span>

                    <span className="truncate text-xs text-zinc-500">
                      {userEmail}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-zinc-800" />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  asChild
                  className="
                    cursor-pointer rounded-lg
                    text-zinc-300
                    focus:bg-zinc-800 focus:text-white
                  "
                >
                  <Link to="/user/account">
                    <CircleUserRound className="size-4" />
                    Tài khoản
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  asChild
                  className="
                    cursor-pointer rounded-lg
                    text-zinc-300
                    focus:bg-zinc-800 focus:text-white
                  "
                >
                  <Link to="/user/notifications">
                    <Bell className="size-4" />
                    Thông báo
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  asChild
                  className="
                    cursor-pointer rounded-lg
                    text-zinc-300
                    focus:bg-zinc-800 focus:text-white
                  "
                >
                  <Link to="user/settings">
                    <Settings className="size-4" />
                    Cài đặt
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="bg-zinc-800" />

              <DropdownMenuItem
                onClick={logout}
                className="
                  cursor-pointer rounded-lg
                  text-red-400
                  focus:bg-red-500/10 focus:text-red-400
                "
              >
                <LogOut className="size-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}