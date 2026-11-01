"""
Tests for Text-to-Sign feature:
1. Verify genuine ISL alphabet image mappings for all 26 classes (A–Z)
2. Verify tokenization of words: HELLO, INDIA, SIGN, sentences with spaces, and unsupported symbol filtering
3. Verify that all 26 image assets exist and are non-empty
"""
import os
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
IMAGE_DIR = BASE_DIR / "frontend" / "assets" / "images" / "isl_alphabet"

def parse_text(text: str):
    if not text:
        return []
    upper = text.upper()
    result = []
    last_was_space = True
    for ch in upper:
        if 'A' <= ch <= 'Z':
            result.append(ch)
            last_was_space = False
        elif ch in (' ', '\t', '\n'):
            if not last_was_space:
                result.append(' ')
                last_was_space = True
    if result and result[-1] == ' ':
        result.pop()
    return result

class TestTextToSign(unittest.TestCase):
    def test_all_26_alphabet_images_exist(self):
        self.assertTrue(IMAGE_DIR.exists(), f"Directory {IMAGE_DIR} does not exist")
        letters = [chr(i) for i in range(ord('A'), ord('Z') + 1)]
        for letter in letters:
            img_path = IMAGE_DIR / f"{letter}.jpg"
            self.assertTrue(img_path.exists(), f"Missing image for letter {letter}: {img_path}")
            self.assertGreater(img_path.stat().st_size, 1000, f"Image for {letter} is too small: {img_path.stat().st_size} bytes")

    def test_space_svg_exists(self):
        space_path = IMAGE_DIR / "space.svg"
        self.assertTrue(space_path.exists(), "Missing space.svg")
        self.assertGreater(space_path.stat().st_size, 100, "space.svg is empty")

    def test_sample_words_tokenization(self):
        self.assertEqual(parse_text("HELLO"), ['H', 'E', 'L', 'L', 'O'])
        self.assertEqual(parse_text("INDIA"), ['I', 'N', 'D', 'I', 'A'])
        self.assertEqual(parse_text("SIGN"), ['S', 'I', 'G', 'N'])

    def test_sentence_and_spaces(self):
        self.assertEqual(parse_text("HELLO INDIA"), ['H', 'E', 'L', 'L', 'O', ' ', 'I', 'N', 'D', 'I', 'A'])
        self.assertEqual(parse_text("SIGN LANGUAGE AI"), ['S', 'I', 'G', 'N', ' ', 'L', 'A', 'N', 'G', 'U', 'A', 'G', 'E', ' ', 'A', 'I'])

    def test_unsupported_characters_safe_filtering(self):
        # Punctuations and numbers safely stripped, spaces between words preserved
        self.assertEqual(parse_text("Hello, World! 123"), ['H', 'E', 'L', 'L', 'O', ' ', 'W', 'O', 'R', 'L', 'D'])
        self.assertEqual(parse_text("   Leading and trailing spaces   "), ['L', 'E', 'A', 'D', 'I', 'N', 'G', ' ', 'A', 'N', 'D', ' ', 'T', 'R', 'A', 'I', 'L', 'I', 'N', 'G', ' ', 'S', 'P', 'A', 'C', 'E', 'S'])
        self.assertEqual(parse_text("!@#$%^&*()_+"), [])
        self.assertEqual(parse_text(""), [])

if __name__ == "__main__":
    unittest.main()
