console.error(
  [
    'Do not use `npm run build` for this app.',
    'Choose an explicit lane instead:',
    '- `npm run build:dev`',
    '- `npm run build:prod`',
    '- `npm run ios:sync:dev`',
    '- `npm run ios:sync:prod`',
  ].join('\n'),
)

process.exit(1)
