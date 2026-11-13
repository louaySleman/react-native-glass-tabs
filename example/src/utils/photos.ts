/**
 * Photos for the example app, loaded at runtime from Unsplash (free to use under the Unsplash
 * License, https://unsplash.com/license). Nothing is bundled with the package.
 */
export const unsplash = (id: string, width: number) =>
  `https://images.unsplash.com/photo-${id}?w=${Math.round(width)}&q=70&auto=format&fit=crop`;

export interface Place {
  id: string;
  title: string;
  place: string;
}

export const PLACES: Place[] = [
  { id: '1506905925346-21bda4d32df4', title: 'Above the clouds', place: 'Dolomites, Italy' },
  { id: '1469474968028-56623f02e42e', title: 'Golden hour', place: 'Lake District, UK' },
  { id: '1501785888041-af3ef285b470', title: 'Still water', place: 'Banff, Canada' },
  { id: '1470071459604-3b5ec3a7fe05', title: 'Morning fog', place: 'Black Forest, Germany' },
  { id: '1441974231531-c6227db76b6e', title: 'Into the woods', place: 'Oregon, USA' },
  { id: '1507525428034-b723cf961d3e', title: 'Turquoise bay', place: 'Maldives' },
  { id: '1494500764479-0c8f2919a3d8', title: 'Night sky', place: 'Atacama, Chile' },
  { id: '1500530855697-b586d89ba3ee', title: 'Open road', place: 'Iceland' },
  { id: '1472214103451-9374bd1c798e', title: 'Rolling hills', place: 'Tuscany, Italy' },
  { id: '1426604966848-d7adac402bff', title: 'Canyon light', place: 'Arizona, USA' },
  { id: '1447752875215-b2761acb3c5d', title: 'Forest path', place: 'Hokkaido, Japan' },
  { id: '1433086966358-54859d0ed716', title: 'Falling water', place: 'Skógafoss, Iceland' },
  { id: '1418065460487-3e41a6c84dc5', title: 'Pine ridge', place: 'British Columbia, Canada' },
  { id: '1500964757637-c85e8a162699', title: 'Valley view', place: 'Patagonia, Argentina' },
  { id: '1519681393784-d120267933ba', title: 'Starlit peaks', place: 'Swiss Alps' },
  { id: '1493246507139-91e8fad9978e', title: 'Alpine lake', place: 'Lofoten, Norway' },
  { id: '1502082553048-f009c37129b9', title: 'Green canopy', place: 'Costa Rica' },
  { id: '1475924156734-496f6cac6ec1', title: 'Desert dusk', place: 'Wadi Rum, Jordan' },
  { id: '1490750967868-88aa4486c946', title: 'Spring bloom', place: 'Kyoto, Japan' },
  { id: '1465146344425-f00d5f5c8f07', title: 'Wildflowers', place: 'Provence, France' },
  { id: '1511884642898-4c92249e20b6', title: 'Quiet shore', place: 'Big Sur, USA' },
  { id: '1505144808419-1957a94ca61e', title: 'Blue hour', place: 'Santorini, Greece' },
];

export interface Person {
  id: string;
  name: string;
  message: string;
  time: string;
}

export const PEOPLE: Person[] = [
  { id: '1494790108377-be9c29b29330', name: 'Maya Thompson', message: 'Those Dolomites shots are unreal 😍', time: '9:41' },
  { id: '1507003211169-0a1dd7228f2d', name: 'Daniel Brooks', message: 'Sending you the route for Saturday', time: '9:12' },
  { id: '1438761681033-6461ffad8d80', name: 'Sofia Martinez', message: 'Can you share the full-res version?', time: '8:47' },
  { id: '1500648767791-00dcc994a43e', name: 'Liam Carter', message: 'Golden hour at 7:20 tomorrow', time: 'Yesterday' },
  { id: '1544005313-94ddf0286df2', name: 'Ava Johnson', message: 'Booked the cabin! 🏔️', time: 'Yesterday' },
  { id: '1534528741775-53994a69daeb', name: 'Chloe Park', message: 'Love the new album cover', time: 'Mon' },
  { id: '1506794778202-cad84cf45f1d', name: 'Noah Williams', message: 'Drone footage is uploading now', time: 'Mon' },
  { id: '1517841905240-472988babdf9', name: 'Emma Wilson', message: 'See you at the trailhead', time: 'Sun' },
];
