import { motion } from "motion/react";

export function HomePage() {
    return (
        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-center space-y-6 px-6 py-12"
            >
            </motion.div>
        </div>
    );
}