import { motion } from "motion/react";
import { DataItemsList } from "../components/DataItemsList";

export function HomePage() {
    return (
        <div className="w-full min-h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="space-y-8"
                >
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                            Digital Brain
                        </h1>
                        
                    </div>

                    <DataItemsList />
                </motion.div>
            </div>
        </div>
    );
}