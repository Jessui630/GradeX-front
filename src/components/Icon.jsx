const paths = {
  shield: 'M12 3 5 6v5c0 4.4 2.9 7.6 7 9 4.1-1.4 7-4.6 7-9V6l-7-3Z M9 11.5l2 2 4-4',
  user: 'M20 21a8 8 0 0 0-16 0 M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  mail: 'M4 5h16v14H4z M4 7l8 6 8-6',
  lock: 'M6 11h12v9H6z M9 11V8a3 3 0 0 1 6 0v3',
  eye: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  'eye-off': 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M3 3l18 18',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  close: 'M6 6l12 12 M18 6 6 18',
  logout: 'M10 5H5v14h5 M14 8l4 4-4 4 M8 12h10',
  'arrow-right': 'M5 12h14 M13 6l6 6-6 6',
  check: 'M5 12l4 4L19 6',
  alert: 'M12 4l9 16H3L12 4Z M12 9v4 M12 17h.01',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3 2',
  clipboard: 'M9 4h6v3H9z M7 5H5v16h14V5h-2 M9 12h6 M9 16h4',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z M21 21l-4.3-4.3',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z',
  users:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8',
  box: 'M12 3l9 5-9 5-9-5 9-5Z M3 8v8l9 5 9-5V8 M12 13v9',
  certificate: 'M6 3h12v12H6z M9 7h6 M9 11h4 M9 15v6l3-2 3 2v-6',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z',
  home: 'M3 11l9-8 9 8 M5 10v11h14V10',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 11v5 M12 8h.01',
  'arrow-left': 'M19 12H5 M11 6l-6 6 6 6',
  'chevron-down': 'M6 9l6 6 6-6',
}

export function Icon({ name, size = 20, className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width={size}
    >
      <path d={paths[name] ?? paths.info} />
    </svg>
  )
}
