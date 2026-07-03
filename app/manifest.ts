import type { MetadataRoute } from 'next';

export default function manifest():MetadataRoute.Manifest {
  return {
    name:'ZendixRP — Dansk FiveM Roleplay',
    short_name:'ZendixRP',
    description:'Det officielle community-site for ZendixRP.',
    start_url:'/',
    display:'standalone',
    background_color:'#070b09',
    theme_color:'#2fdf82',
    icons:[
      {src:'/icon.png',sizes:'97x80',type:'image/png'},
      {src:'/images/zendix-logo.png',sizes:'97x80',type:'image/png'},
    ],
  };
}
