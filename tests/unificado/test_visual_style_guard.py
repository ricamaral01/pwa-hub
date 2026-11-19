"""Prove that the guard rejects the regressions named in the visual brief."""
import unittest
from visual_style_guard import css_errors, js_style_errors, EMOJI

class GuardTests(unittest.TestCase):
    def test_forbidden_styles(self):
        cases = {'font-family': 'x{font-family:var(--f-sans)}',
                 'color': 'x{color:#ff00ff}',
                 'gradient': 'x{background:linear-gradient(red,blue)}',
                 'decorative-title': '.eyebrow{color:var(--c-ink)}'}
        for expected, source in cases.items():
            with self.subTest(expected=expected):
                self.assertIn(expected, css_errors(source))

    def test_palette_and_print(self):
        self.assertFalse(css_errors('x{color:var(--c-navy);border-color:#e1e5eb}'))
        self.assertFalse(css_errors('@media print{x{font-family:Arial;color:#ff00ff}}'))
        self.assertFalse(css_errors('body{font-family:Geist}', tokens=True))

    def test_literal_and_escaped_emoji(self):
        self.assertIsNotNone(EMOJI.search('\U0001f4ca'))
        self.assertIsNotNone(EMOJI.search(r'\uD83D\uDCCA'))
        self.assertIsNone(EMOJI.search('✓ Concluída'))

    def test_javascript_style_properties(self):
        self.assertIn('color',js_style_errors('node.style.background="'+'#ff00ff'+'"'))
        self.assertIn('font-family',js_style_errors('node.style.fontFamily="Arial"'))
        self.assertIn('gradient',js_style_errors('node.style.cssText="background:linear-gradient(red,blue)"'))
        self.assertFalse(js_style_errors('node.style.color="var(--c-blue)"'))

if __name__ == '__main__':
    unittest.main()
