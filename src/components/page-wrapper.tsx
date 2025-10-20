"use client"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"

export const PageWrapper = ({children}: {children: React.ReactNode}) => {
    const pathname = usePathname()
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ delay: 0.25}}
                className="flex-1"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}
