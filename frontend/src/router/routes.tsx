import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { NotFoundError } from "../app/pages/error-page";
import { HomePage } from "../app/pages/home.page";
import Layout from "../Layout";

export const routes: RouteObject[] = [
	{
		path: "/",
		element: <Layout />,
		errorElement: <NotFoundError />,

		children: [
			{
				index: true,
				element: <HomePage />,
			},
			{
				path: "profile",
				element: <Layout />,
			},
			{
				path: "models",
				element: <Layout />,
			},
			{
				path: "models/create",
				element: <Layout />,
			},
			{
				path: "models/:modelId/signatures/create",
				element: <Layout />,
			},
			{
				path: "models/:modelId/signatures/:signatureId/predictions/create",
				element: <Layout />,
			},
			{
				path: "models/:modelId/signatures/:signatureId/predictions/create/:inputs",
				element: <Layout />,
			},
		],
	},
];

export const router = createBrowserRouter(routes);
