"use client";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import ClapButton from "./ClapButton";
import BookmarkButton from "./BookmarkButton";
import ShareButton from "./ShareButton";
import { BookmarkItem } from "./BookmarkButton";

type FloatingActionBarProps = {
  postId: string;
  initialClaps: number;
  postForBookmark: BookmarkItem;
  articleUrl: string;
  articleTitle: string;
};

export default function FloatingActionBar({
  postId,
  initialClaps,
  postForBookmark,
  articleUrl,
  articleTitle
}: FloatingActionBarProps) {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  // Hide the bar when scrolling down, show when scrolling up
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <motion.div
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: 100, opacity: 0 }
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-4 bg-white/80 backdrop-blur-xl px-6 py-3 rounded-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200/50">
        
        {/* We use a compact wrapper for ClapButton to make it fit nicely */}
        <div className="flex items-center">
          <ClapButton postId={postId} initialClaps={initialClaps} compact={true} />
        </div>

        <div className="w-px h-6 bg-slate-200" />

        <BookmarkButton post={postForBookmark} />

        <div className="w-px h-6 bg-slate-200" />

        <ShareButton title={articleTitle} url={articleUrl} />
      </div>
    </motion.div>
  );
}
