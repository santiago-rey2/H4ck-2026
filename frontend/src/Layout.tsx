import { useAtom } from "jotai";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { mobileActiveViewAtom } from "@/app/atoms";
import { LinkIframeModal } from "@/app/components/LinkIframeModal";
import { DesktopLayout } from "@/layout/DesktopLayout";
import { MobileLayout } from "@/layout/MobileLayout";
import { TabletLayout } from "@/layout/TabletLayout";
import { useViewportMode } from "@/layout/useViewportMode";

function Layout() {
	const location = useLocation();
	const [mobileView, setMobileView] = useAtom(mobileActiveViewAtom);
	const viewportMode = useViewportMode();
	const routeKey = `${location.pathname}${location.search}${location.hash}`;

	useEffect(() => {
		if (viewportMode !== "mobile" && mobileView !== "home") {
			setMobileView("home");
		}
	}, [mobileView, setMobileView, viewportMode]);

	return (
		<>
			{viewportMode === "desktop" ? (
				<DesktopLayout routeKey={routeKey} />
			) : null}
			{viewportMode === "tablet" ? <TabletLayout routeKey={routeKey} /> : null}
			{viewportMode === "mobile" ? (
				<MobileLayout
					routeKey={routeKey}
					mobileView={mobileView}
					onViewChange={setMobileView}
				/>
			) : null}
			<LinkIframeModal />
		</>
	);
}

export default Layout;
