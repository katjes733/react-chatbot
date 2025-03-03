"use client";
import { lazy, Suspense, useEffect, useState } from "react";

const MyChatBot = lazy(() => import("@/components/MyChatBot"));

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setIsLoaded(true);
  }, [])

  return (
    <>
    {isLoaded && (
      <Suspense fallback={<div>Loading...</div>}>
        <MyChatBot />
      </Suspense>
    )}
    </>
  );
}