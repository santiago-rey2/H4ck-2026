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
		],
	},
];

export const router = createBrowserRouter(routes);
