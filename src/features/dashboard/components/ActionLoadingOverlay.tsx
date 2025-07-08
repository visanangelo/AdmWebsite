import React from 'react'
import { AnimatePresence, motion } from "framer-motion"

interface ActionLoadingOverlayProps {
  isVisible: boolean
}

export const ActionLoadingOverlay = React.memo<ActionLoadingOverlayProps>(({ isVisible }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="flex items-center gap-4 bg-card p-6 rounded-xl shadow-2xl border border-border"
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary/20 border-t-primary"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary/40 animate-ping" />
          </div>
          <div>
            <span className="text-sm font-medium text-foreground">Processing...</span>
            <p className="text-xs text-muted-foreground">Please wait while we complete your request</p>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
))

ActionLoadingOverlay.displayName = 'ActionLoadingOverlay' 