import type { ProjectConfig } from '@patopest/astro-theme/config';
import icon from './assets/icon.svg?raw';

const repository = 'https://gitlab.com/patopest/sacn-monitor';

export const project: ProjectConfig = {
  name: 'sACN Monitor',
  tagline: 'See every sACN and ArtNet universe on your network.',
  description:
    'Monitor DMX data carried over sACN (ANSI E1.31) or ArtNet in a clean, intuitive interface. Native apps for macOS, Windows and Linux.',
  domain: 'https://sacn-monitor.bambinito.net',
  copyright: '© 2023-2026 Alban Moreon',
  accent: '#06b6d4',
  icon: { svg: icon, size: '30px' },
  gitlabProject: 'patopest/sacn-monitor',
  repoUrl: repository,
  timeZone: 'America/Toronto',
  nav: [
    { label: 'Features', href: '/#features' },
    { label: 'Docs', href: '/docs/getting-started/' },
    { label: 'Release notes', href: '/release-notes/' },
  ],
  platforms: [
    { os: 'macos', label: 'macOS', note: 'Apple Silicon and Intel. Requires macOS 12 or later.' },
    { os: 'windows', label: 'Windows', note: 'Windows 10 or later, amd64 and arm64.' },
    { os: 'linux', label: 'Linux', note: 'amd64 and arm64, as AppImage, .deb, .rpm or Arch package.' },
  ],
  footer: [
    {
      title: 'Project',
      links: [
        { label: 'Features', href: '/#features' },
        { label: 'Download', href: '/download/' },
        { label: 'Release notes', href: '/release-notes/' },
      ],
    },
    {
      title: 'Docs',
      links: [
        { label: 'Getting started', href: '/docs/getting-started/' },
        { label: 'Universes', href: '/docs/universes/' },
        { label: 'Channels', href: '/docs/channels/' },
        { label: 'Protocols', href: '/docs/protocols/' },
        { label: 'FAQ', href: '/docs/faq/' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Source code', href: repository },
        { label: 'Report an issue', href: `${repository}/-/issues` },
        { label: 'License', href: `${repository}/-/blob/master/LICENSE` },
      ],
    },
  ],
  projects: [
    {
      name: 'Multiviewer',
      description: 'Hardware-accelerated multi-protocol video multiviewer.',
      href: 'https://multiviewer.bambinito.net',
    },
    {
      name: 'Timecoder',
      description: 'View, edit, convert and route Timecode in realtime.',
      href: 'https://gitlab.com/patopest/timecoder',
    },
    {
      name: 'GrandMA3 plugins and LUA docs',
      description: 'A collection of grandMA3 plugins and comprehensive LUA documentation.',
      href: 'https://grandma3.bambinito.net',
    },
  ],
};
