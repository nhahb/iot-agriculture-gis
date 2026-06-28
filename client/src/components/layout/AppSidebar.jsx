import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, Sidebar } from "../ui/sidebar";
import SidebarMainMenu from "./SidebarMainMenu";
import SidebarHeaderContent from "./SidebarHeaderContent";
import SidebarFooterContent from "./SidebarFooterContent";

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-zinc-100">
      <SidebarProvider>
        <Sidebar>
          <SidebarHeaderContent />
          <SidebarMainMenu />
          <SidebarFooterContent />
        </Sidebar>
        <SidebarTrigger />
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </SidebarProvider>
    </div>
  );
};

export default Layout;
