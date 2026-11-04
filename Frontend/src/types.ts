export interface PhotoCard {
  src: string;
  alt: string;
  title: string;
  location: string;
  tilt: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Destination {
  id: string;
  rank: number;
  name: string;
  province: string;
  memoriesCount: number;
  trendingDelta: number;
  tag: string;
  imageUrl: string;
}

export interface MapMarkerPoint {
  id: string;
  name: string;
  province: string;
  xPercent: number; // percentage on SVG Vietnam map
  yPercent: number;
  memoriesCount: number;
  rating: number;
  coverImage: string;
  description: string;
}
