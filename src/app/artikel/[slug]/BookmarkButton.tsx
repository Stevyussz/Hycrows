"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { motion } from "framer-motion";

export type BookmarkItem = {
  slug: string;
  title: string;
  excerpt: string;
  authorName: string;
  categoryTitle: string;
  publishedAt: string;
};

type BookmarkButtonProps = {
  post: BookmarkItem;
};

export default function BookmarkButton({ post }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("dpn_bookmarks");
    if (stored) {
      const bookmarks: BookmarkItem[] = JSON.parse(stored);
      setIsBookmarked(bookmarks.some((b) => b.slug === post.slug));
    }
  }, [post.slug]);

  const toggleBookmark = () => {
    const stored = localStorage.getItem("dpn_bookmarks");
    let bookmarks: BookmarkItem[] = stored ? JSON.parse(stored) : [];

    if (isBookmarked) {
      // Remove
      bookmarks = bookmarks.filter((b) => b.slug !== post.slug);
      setIsBookmarked(false);
    } else {
      // Add
      bookmarks.push(post);
      setIsBookmarked(true);
    }

    localStorage.setItem("dpn_bookmarks", JSON.stringify(bookmarks));
  };

  if (!isMounted) return null; // Prevent hydration mismatch

  return (
    <button
      onClick={toggleBookmark}
      title={isBookmarked ? "Hapus dari Simpanan" : "Baca Nanti"}
      className={`relative flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 ${
        isBookmarked
          ? "bg-brand/10 border-brand text-brand"
          : "bg-white border-slate-200 text-slate-400 hover:border-brand hover:text-brand"
      }`}
    >
      <motion.div
        animate={isBookmarked ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Bookmark size={18} className={isBookmarked ? "fill-brand" : ""} />
      </motion.div>
    </button>
  );
}
