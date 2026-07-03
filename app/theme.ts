'use client';

import { createTheme, MantineColorsTuple } from '@mantine/core';

const zendixGreen: MantineColorsTuple = [
  '#ecfff5', '#d8fbe9', '#acf5cf', '#7cedb4', '#54e69c',
  '#3ce18b', '#2fdf82', '#20c770', '#12b164', '#009954',
];

export const theme = createTheme({
  primaryColor: 'zendix',
  colors: { zendix: zendixGreen },
  fontFamily: 'var(--font-body), Inter, sans-serif',
  headings: { fontFamily: 'var(--font-display), Inter, sans-serif', fontWeight: '700' },
  defaultRadius: 'md',
  cursorType: 'pointer',
  components: {
    Button: { defaultProps: { radius: 'xl' }, styles: { root: { fontWeight: 700 } } },
    Card: { defaultProps: { radius: 'lg' } },
    TextInput: { defaultProps: { radius: 'md' } },
    Textarea: { defaultProps: { radius: 'md' } },
    Select: { defaultProps: { radius: 'md' } },
  },
});
