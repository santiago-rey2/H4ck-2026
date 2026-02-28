import { Outlet } from "react-router-dom";
import { Sidebar } from "./app/components";

function Layout() {
	return (
		<div className="w-screen h-screen flex overflow-hidden bg-gray-100 dark:bg-gray-900">
			{/* Main Content Area - 90% */}
			<div className="flex-1 relative overflow-y-auto">
				<Outlet />
			</div>

			{/* Sidebar - 10% - Hidden on mobile */}
			<div className="hidden md:block md:w-[10%] md:min-w-[200px]">
				<Sidebar />
			</div>
		</div>
	);
}

export default Layout;
