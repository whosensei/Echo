"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ImageData } from "@/lib/schema/types";

// Pre-defined mock data to avoid hydration issues
const MOCK_IMAGES: ImageData[] = [
  { id: '1', url: 'https://picsum.photos/300/400?random=1', aspectRatio: 0.75, title: 'Nature Scene 1' },
  { id: '2', url: 'https://picsum.photos/300/225?random=2', aspectRatio: 1.33, title: 'Architecture 1' },
  { id: '3', url: 'https://picsum.photos/300/300?random=3', aspectRatio: 1.0, title: 'Food 1' },
  { id: '4', url: 'https://picsum.photos/300/535?random=4', aspectRatio: 0.56, title: 'Travel 1' },
  { id: '5', url: 'https://picsum.photos/300/169?random=5', aspectRatio: 1.78, title: 'People 1' },
  { id: '6', url: 'https://picsum.photos/300/375?random=6', aspectRatio: 0.8, title: 'Animals 1' },
  { id: '7', url: 'https://picsum.photos/300/250?random=7', aspectRatio: 1.2, title: 'Technology 1' },
  { id: '8', url: 'https://picsum.photos/300/400?random=8', aspectRatio: 0.75, title: 'Business 1' },
  { id: '9', url: 'https://picsum.photos/300/225?random=9', aspectRatio: 1.33, title: 'Fashion 1' },
  { id: '10', url: 'https://picsum.photos/300/300?random=10', aspectRatio: 1.0, title: 'Art 1' },
  { id: '11', url: 'https://picsum.photos/300/535?random=11', aspectRatio: 0.56, title: 'Sports 1' },
  { id: '12', url: 'https://picsum.photos/300/169?random=12', aspectRatio: 1.78, title: 'Music 1' },
  { id: '13', url: 'https://picsum.photos/300/375?random=13', aspectRatio: 0.8, title: 'Nature Scene 2' },
  { id: '14', url: 'https://picsum.photos/300/250?random=14', aspectRatio: 1.2, title: 'Architecture 2' },
  { id: '15', url: 'https://picsum.photos/300/400?random=15', aspectRatio: 0.75, title: 'Food 2' },
  { id: '16', url: 'https://picsum.photos/300/225?random=16', aspectRatio: 1.33, title: 'Travel 2' },
  { id: '17', url: 'https://picsum.photos/300/300?random=17', aspectRatio: 1.0, title: 'People 2' },
  { id: '18', url: 'https://picsum.photos/300/535?random=18', aspectRatio: 0.56, title: 'Animals 2' },
  { id: '19', url: 'https://picsum.photos/300/169?random=19', aspectRatio: 1.78, title: 'Technology 2' },
  { id: '20', url: 'https://picsum.photos/300/375?random=20', aspectRatio: 0.8, title: 'Business 2' },
];

// Generate more mock images by cycling through the base set
const generateMockImages = (count: number): ImageData[] => {
  const images: ImageData[] = [];
  for (let i = 0; i < count; i++) {
    const baseImage = MOCK_IMAGES[i % MOCK_IMAGES.length];
    images.push({
      ...baseImage,
      id: `img-${i + 1}`,
      url: `https://picsum.photos/300/${Math.round(300 / baseImage.aspectRatio)}?random=${i + 1}`,
      title: `${baseImage.title} - ${Math.floor(i / MOCK_IMAGES.length) + 1}`,
    });
  }
  return images;
};

interface ImageLibraryProps {
  className?: string;
}

export function ImageLibrary({ className }: ImageLibraryProps) {
  const [mounted, setMounted] = useState(false);
  const [allImages, setAllImages] = useState<ImageData[]>([]);
  const [displayedImages, setDisplayedImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const IMAGES_PER_PAGE = 12;
  const TOTAL_IMAGES = 100;

  // Fix hydration by ensuring client-only initialization
  useEffect(() => {
    setMounted(true);
    const mockImages = generateMockImages(TOTAL_IMAGES);
    setAllImages(mockImages);
    setDisplayedImages(mockImages.slice(0, IMAGES_PER_PAGE));
  }, []);

  // Load more images function
  const loadMoreImages = useCallback(() => {
    if (loading || !hasMore || !mounted) return;

    setLoading(true);
    
    setTimeout(() => {
      const startIndex = page * IMAGES_PER_PAGE;
      const endIndex = startIndex + IMAGES_PER_PAGE;
      const nextImages = allImages.slice(startIndex, endIndex);
      
      if (nextImages.length === 0 || startIndex >= TOTAL_IMAGES) {
        setHasMore(false);
      } else {
        setDisplayedImages(prev => [...prev, ...nextImages]);
        setPage(prev => prev + 1);
      }
      
      setLoading(false);
    }, 800); // Simulate network delay
  }, [loading, hasMore, mounted, page, allImages]);

  // Set up intersection observer
  useEffect(() => {
    if (!mounted) return;

    const currentLoadingRef = loadingRef.current;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMoreImages();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '200px'
      }
    );

    if (currentLoadingRef) {
      observerRef.current.observe(currentLoadingRef);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [mounted, hasMore, loading, loadMoreImages]);

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className={`w-full ${className}`}>
        <div className="px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading image library...</p>
          </div>
        </div>
      </div>
    );
  }

  const getImageHeight = (aspectRatio: number): number => {
    const baseWidth = 300;
    return Math.round(baseWidth / aspectRatio);
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="px-4 max-w-8xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Image Library</h1>
        
        {/* Masonry Grid using columns */}
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-2 space-y-2">
          {displayedImages.map((image) => {
            const height = getImageHeight(image.aspectRatio);
            
            return (
              <div
                key={image.id}
                className="break-inside-avoid mb-4"
              >
                <div className="relative overflow-hidden rounded-sm shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group bg-gray-100">
                  <Image
                    src={image.url}
                    alt={image.title || 'Gallery image'}
                    width={300}
                    height={height}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-end">
                    <div className="p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-full">
                      <p className="text-sm font-medium truncate">{image.title}</p>
                      <p className="text-xs opacity-75">
                        {Math.round(300 / image.aspectRatio)}×300 • {image.aspectRatio.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Loading trigger */}
        <div 
          ref={loadingRef}
          className="w-full py-8 flex justify-center items-center"
        >
          {loading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <span className="text-gray-600">Loading more images...</span>
            </div>
          )}
        </div>

        {/* End of content indicator */}
        {!hasMore && displayedImages.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">You've reached the end! 🎉</p>
            <p className="text-sm text-gray-400 mt-2">
              Showing {displayedImages.length} of {TOTAL_IMAGES} images
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 