"use client";

import { useEffect } from "react";
import { pushRecentlyViewed, type RecentItem } from "@/lib/recently-viewed";

export function TrackVisit(props: Omit<RecentItem, "viewedAt">) {
  const { id, name, category, href } = props;

  useEffect(() => {
    pushRecentlyViewed({ id, name, category, href });
  }, [id, name, category, href]);

  return null;
}
