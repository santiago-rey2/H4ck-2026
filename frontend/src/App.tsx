import { useState } from "react";

function App() {
	const [count, setCount] = useState(0);

	return (
		<div className="mx-auto max-w-5xl p-8 text-center">
			<div></div>
			<h1 className="text-5xl font-bold leading-tight">Vite + React</h1>
			<div className="p-8">
				<button
					type="button"
					className="cursor-pointer rounded-lg border border-transparent bg-neutral-900 px-5 py-2.5 text-base font-medium transition-colors hover:border-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-400 dark:bg-neutral-900 light:bg-gray-100"
					onClick={() => setCount((count) => count + 1)}
				>
					count is {count}
				</button>
				<p className="mt-4">
					Edit <code className="font-mono">src/App.tsx</code> and save to test
					HMR
				</p>
			</div>
			<p className="text-gray-400">
				Click on the Vite and React logos to learn more
			</p>
		</div>
	);
}

export default App;
