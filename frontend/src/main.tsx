import {
	MutationCache,
	QueryCache,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { Provider } from "jotai";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { ErrorModalProvider } from "./app/components/ErrorModalProvider";
import { ToastProvider } from "./app/components/ToastProvider";
import { emitErrorFromUnknown } from "./app/utils/error-sink";
import "./index.css";
import { router } from "./router/routes";

const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error, query) => {
			if (query.queryKey[0] === "user") {
				return;
			}
			emitErrorFromUnknown(error);
		},
	}),
	// Route ALL mutation errors here
	mutationCache: new MutationCache({
		onError: (error, _vars, _ctx, _mutation) => {
			emitErrorFromUnknown(error);
		},
	}),
	defaultOptions: {
		queries: { staleTime: 5 * 60_000, retry: 1 },
	},
});

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element '#root' not found");
}

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<ToastProvider>
			<ErrorModalProvider>
				<QueryClientProvider client={queryClient}>
					<Provider>
						<RouterProvider router={router} />
					</Provider>
				</QueryClientProvider>
			</ErrorModalProvider>
		</ToastProvider>
	</React.StrictMode>,
);
